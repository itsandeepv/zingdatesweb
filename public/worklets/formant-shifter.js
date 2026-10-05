/**
 * Formant shifter — an AudioWorklet that moves vocal-tract resonances without
 * touching pitch.
 *
 * Why this exists: a plain pitch shifter raises the fundamental AND the
 * formants by the same ratio, which is the chipmunk effect — a sped-up tape,
 * not a different person. Voice gender needs the two moved by DIFFERENT
 * amounts: a male-to-female shift wants F0 up ~1.7x but formants up only
 * ~1.2x. So the chain pitch-shifts everything up, then this pulls the formants
 * back down by the remainder.
 *
 * It deliberately does NOT do phase-vocoder work. Only the magnitude envelope
 * is warped; every bin keeps its original phase. That costs nothing in quality
 * here (the envelope is what carries formant identity) and avoids the smeared,
 * watery "phasiness" a badly-tuned vocoder adds to speech.
 */

const FFT_SIZE = 1024;
const HOP = FFT_SIZE / 4;          // 75% overlap
const BINS = FFT_SIZE / 2 + 1;
// Hann analysis + Hann synthesis at 75% overlap sums to exactly 1.5.
const OLA_GAIN = 1 / 1.5;
// Envelope smoothing half-width in bins. At 48k/1024 a bin is ~47 Hz, so ±3
// spans ~330 Hz: wide enough to erase the harmonic comb of even a low male
// voice (~120 Hz spacing), narrow enough to leave formants standing.
const SMOOTH = 3;
const EPS = 1e-10;
// How far a bin may be boosted. A formant has to be ABLE to move into a region
// that was near-silent, so this cannot be tight -- clamping at 4x compressed a
// requested 1.6x shift down to 1.21x. The envelope floor below is what keeps
// that headroom from turning quiet bins into hiss.
const MAX_GAIN = 24;
// Envelope floor, relative to the loudest band in the frame. Without it the
// gain is (something / almost nothing) in every quiet bin and the ratio runs
// away; with it the boost is bounded by construction, not by the clamp.
const ENV_FLOOR = 2e-3;

/** In-place iterative radix-2 FFT. */
function fft(re, im, inverse) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      let t = re[i]; re[i] = re[j]; re[j] = t;
      t = im[i]; im[i] = im[j]; im[j] = t;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (inverse ? 2 : -2) * Math.PI / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const ur = re[i + k], ui = im[i + k];
        const vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci;
        const vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
        re[i + k] = ur + vr; im[i + k] = ui + vi;
        re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
        const ncr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr; cr = ncr;
      }
    }
  }
  if (inverse) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
}

class FormantShifter extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{
      // <1 lowers formants, >1 raises them. 1 is a bypass.
      name: 'ratio', defaultValue: 1, minValue: 0.5, maxValue: 2,
      automationRate: 'k-rate',
    }];
  }

  constructor() {
    super();
    this.win = new Float32Array(FFT_SIZE);
    for (let i = 0; i < FFT_SIZE; i++) {
      this.win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / FFT_SIZE);
    }
    this.inBuf = new Float32Array(FFT_SIZE);   // sliding analysis window
    this.outBuf = new Float32Array(FFT_SIZE);  // overlap-add accumulator
    this.inFill = 0;                           // new samples since the last frame
    // Finished samples waiting to be played out. Kept separate from outBuf so
    // output is only ever read AFTER the frame that produced it has been
    // overlap-added — reading the accumulator directly drops a hop's worth of
    // every frame and turns speech into a stutter.
    this.fifo = new Float32Array(FFT_SIZE * 4);
    this.fifoRead = 0;
    this.fifoWrite = 0;
    this.re = new Float32Array(FFT_SIZE);
    this.im = new Float32Array(FFT_SIZE);
    this.mag = new Float32Array(BINS);
    this.env = new Float32Array(BINS);
  }

  /** Smoothed magnitude spectrum — the harmonics averaged away, formants left. */
  buildEnvelope() {
    const { mag, env } = this;
    let peak = 0;
    for (let k = 0; k < BINS; k++) {
      let sum = 0, n = 0;
      const lo = Math.max(0, k - SMOOTH), hi = Math.min(BINS - 1, k + SMOOTH);
      for (let j = lo; j <= hi; j++) { sum += mag[j]; n++; }
      const v = sum / n;
      env[k] = v;
      if (v > peak) peak = v;
    }
    const floor = peak * ENV_FLOOR;
    for (let k = 0; k < BINS; k++) if (env[k] < floor) env[k] = floor;
  }

  processFrame(ratio) {
    const { re, im, win, mag, env } = this;

    for (let i = 0; i < FFT_SIZE; i++) { re[i] = this.inBuf[i] * win[i]; im[i] = 0; }
    fft(re, im, false);

    for (let k = 0; k < BINS; k++) mag[k] = Math.hypot(re[k], im[k]);
    this.buildEnvelope();

    // Each bin is rescaled by (envelope it SHOULD have) / (envelope it has).
    // Reading the source envelope at k/ratio moves the formants to k.
    for (let k = 0; k < BINS; k++) {
      const src = k / ratio;
      let want;
      if (src >= BINS - 1) {
        want = env[BINS - 1];
      } else {
        const i0 = src | 0, f = src - i0;
        want = env[i0] * (1 - f) + env[i0 + 1] * f;
      }
      // Clamped so a near-silent bin cannot explode into a burst of noise.
      let g = want / (env[k] + EPS);
      if (!(g > 0)) g = 0;
      else if (g > MAX_GAIN) g = MAX_GAIN;

      re[k] *= g; im[k] *= g;
      if (k > 0 && k < BINS - 1) {       // keep the spectrum conjugate-symmetric
        re[FFT_SIZE - k] = re[k];
        im[FFT_SIZE - k] = -im[k];
      }
    }

    fft(re, im, true);

    for (let i = 0; i < FFT_SIZE; i++) this.outBuf[i] += re[i] * win[i] * OLA_GAIN;
  }

  process(inputs, outputs, params) {
    const input = inputs[0];
    const output = outputs[0];
    if (!output || !output[0]) return true;

    const inCh = input && input[0] ? input[0] : null;
    const outCh = output[0];
    const n = outCh.length;
    const ratio = params.ratio.length > 0 ? params.ratio[0] : 1;

    for (let i = 0; i < n; i++) {
      this.inBuf[FFT_SIZE - HOP + this.inFill] = inCh ? inCh[i] : 0;
      this.inFill++;

      if (this.inFill === HOP) {
        this.inFill = 0;
        this.processFrame(ratio);

        // The leading hop of the accumulator is now complete — every frame that
        // overlaps it has contributed. Hand it to the fifo and slide.
        // Compact rather than shifting per sample: moving the whole fifo for
        // every output sample is quadratic and audibly glitches.
        if (this.fifoWrite + HOP > this.fifo.length) {
          this.fifo.copyWithin(0, this.fifoRead, this.fifoWrite);
          this.fifoWrite -= this.fifoRead;
          this.fifoRead = 0;
        }
        this.fifo.set(this.outBuf.subarray(0, HOP), this.fifoWrite);
        this.fifoWrite += HOP;
        this.inBuf.copyWithin(0, HOP);
        this.outBuf.copyWithin(0, HOP);
        this.outBuf.fill(0, FFT_SIZE - HOP);
      }

      // Silent for the first few hops while the pipeline primes, then steady.
      outCh[i] = this.fifoRead < this.fifoWrite ? this.fifo[this.fifoRead++] : 0;
    }

    // Mirror mono to every output channel.
    for (let c = 1; c < output.length; c++) output[c].set(outCh);
    return true;
  }
}

registerProcessor('formant-shifter', FormantShifter);
