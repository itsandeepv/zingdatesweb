/**
 * Male-to-female voice shaping for outgoing web calls.
 *
 * Browser-only: it touches AudioContext and MediaStream, so it must never be
 * imported at module scope from a server component — load it with a dynamic
 * import inside the call UI.
 *
 * Two stages, because voice gender is two things, not one:
 *
 *   mic → PitchShift(+semitones) → formant-shifter(ratio) → outgoing track
 *
 * A pitch shifter alone raises the fundamental AND the vocal-tract resonances
 * by the same factor, which is the chipmunk effect — a sped-up tape, not a
 * different person. A male-to-female shift wants F0 up a lot (~1.7x, roughly
 * 120 Hz to 210 Hz) and formants up only a little (~1.2x). So stage one raises
 * everything and stage two pulls the formants back down by the remainder.
 *
 * The contract is deliberately forgiving. A call is more important than an
 * effect, so every failure path returns the untouched microphone track rather
 * than throwing. It does NOT fail silently though: `reason` carries what went
 * wrong so the UI can say it out loud.
 */

export interface VoiceProcessor {
  /** The track to send. Either processed, or the raw mic if processing failed. */
  readonly track: MediaStreamTrack
  /** False when we fell back to the raw mic, so the UI can stay honest. */
  readonly active: boolean
  /** Why it fell back. Undefined when `active`. */
  readonly reason?: string
  /** Releases the AudioContext and every node. Safe to call more than once. */
  dispose: () => Promise<void>
}

export interface VoiceOptions {
  /** How far to raise pitch. ~9 puts a male fundamental in a female range. */
  semitones?: number
  /**
   * Formant correction applied AFTER the pitch shift. Below 1 pulls the
   * resonances back down; 1 leaves the chipmunk effect in place.
   *
   * Measured, not guessed: driving a single spectral bump through the worklet
   * shows the shift is compressive and saturates near 0.62x down and 1.33x up,
   * so asking for more than that achieves nothing. 0.6 lands around 0.71x in
   * practice, which against a 1.68x pitch shift leaves formants near 1.2x —
   * the male-to-female target.
   */
  formantRatio?: number
}

const WORKLET_URL = '/worklets/formant-shifter.js'

/** A no-op processor wrapping the unmodified microphone. */
function passthrough(track: MediaStreamTrack, reason: string): VoiceProcessor {
  return { track, active: false, reason, dispose: async () => {} }
}

function describe(err: unknown): string {
  const e = err as { name?: string; message?: string }
  if (e?.name && e?.message) return `${e.name}: ${e.message}`
  return e?.message || String(err)
}

export async function createVoiceProcessor(
  source: MediaStream,
  options: VoiceOptions | number = {},
): Promise<VoiceProcessor> {
  // Older call sites passed a bare semitone count.
  const opts: VoiceOptions = typeof options === 'number' ? { semitones: options } : options
  const semitones = opts.semitones ?? 9
  const formantRatio = opts.formantRatio ?? 0.6

  const [micTrack] = source.getAudioTracks()
  if (!micTrack) {
    throw new Error('No audio track on the source stream')
  }

  let Tone: typeof import('tone')
  try {
    Tone = await import('tone')
  } catch (err) {
    return passthrough(micTrack, `audio library failed to load (${describe(err)})`)
  }

  const cleanup: Array<() => void> = []

  try {
    // Tone's context starts suspended and only a user gesture may resume it.
    // Every caller here is inside a click handler, but the await chain before
    // this point can outlive the activation window in some browsers, so check
    // the state rather than assuming start() succeeded.
    await Tone.start()

    const ctx = Tone.getContext()
    if (ctx.state === 'closed') {
      return passthrough(micTrack, 'the audio context was already closed')
    }
    if (ctx.state !== 'running') {
      try { await ctx.resume() } catch { /* reported just below */ }
    }
    if (ctx.state !== 'running') {
      return passthrough(micTrack, `audio context stuck in "${ctx.state}" — needs a click first`)
    }

    const input = ctx.createMediaStreamSource(source)
    const destination = ctx.createMediaStreamDestination()
    cleanup.push(() => { try { input.disconnect() } catch {} })
    cleanup.push(() => { try { destination.disconnect() } catch {} })

    const shift = new Tone.PitchShift({
      pitch: semitones,
      // Small window keeps latency low enough for conversation; the artefacts
      // it introduces are far less disruptive on a call than lag.
      windowSize: 0.05,
    })
    cleanup.push(() => { try { shift.disconnect(); shift.dispose() } catch {} })

    // The formant stage is the part that makes it a voice rather than a
    // chipmunk, but it is also the part most likely to be unavailable (no
    // AudioWorklet, worklet file missing after a bad deploy). Losing it is
    // worth a warning, not a dead toggle, so the chain falls back to pitch
    // only rather than refusing to run.
    let formant: AudioWorkletNode | null = null
    try {
      await ctx.addAudioWorkletModule(WORKLET_URL)
      formant = ctx.createAudioWorkletNode('formant-shifter')
      formant.parameters.get('ratio')!.value = formantRatio
      cleanup.push(() => { try { formant!.disconnect() } catch {} })
    } catch (err) {
      console.warn('[voice] formant stage unavailable, pitch only', err)
    }

    // Tone nodes sit on Tone's own graph, so bridge in and out of raw WebAudio.
    Tone.connect(input, shift)
    if (formant) {
      Tone.connect(shift, formant)
      Tone.connect(formant, destination)
    } else {
      Tone.connect(shift, destination)
    }

    const [outTrack] = destination.stream.getAudioTracks()
    if (!outTrack) {
      cleanup.forEach(fn => fn())
      return passthrough(micTrack, 'the processed stream produced no audio track')
    }

    let disposed = false
    return {
      track: outTrack,
      active: true,
      dispose: async () => {
        if (disposed) return
        disposed = true
        cleanup.forEach(fn => fn())
        // The mic track is the caller's — only the processed one is ours.
        try { outTrack.stop() } catch {}
      },
    }
  } catch (err) {
    cleanup.forEach(fn => fn())
    console.warn('[voice] voice shaping unavailable, sending the raw mic', err)
    return passthrough(micTrack, describe(err))
  }
}

export { passthrough as rawVoiceProcessor }
