/**
 * Pitch-shifts an outgoing microphone stream for web calls.
 *
 * Browser-only: it touches AudioContext and MediaStream, so it must never be
 * imported at module scope from a server component — load it with a dynamic
 * import inside the call UI.
 *
 * The contract is deliberately forgiving. A call is more important than an
 * effect, so every failure path returns the untouched microphone track rather
 * than throwing. It does NOT fail silently though: `reason` carries what went
 * wrong so the UI can say it out loud, because a generic "could not start" is
 * unfixable from a bug report.
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

/** A no-op processor wrapping the unmodified microphone. */
function passthrough(track: MediaStreamTrack, reason: string): VoiceProcessor {
  return { track, active: false, reason, dispose: async () => {} }
}

function describe(err: unknown): string {
  const e = err as { name?: string; message?: string }
  if (e?.name && e?.message) return `${e.name}: ${e.message}`
  return e?.message || String(err)
}

/**
 * Build a pitch-shifted track from `source`.
 *
 * `semitones` is how far up to shift; +5 lands a typical male range inside a
 * typical female one. The source stream is left running and is NOT stopped by
 * dispose() — it belongs to the caller, which still needs it for the raw track.
 */
export async function createVoiceProcessor(
  source: MediaStream,
  semitones = 5,
): Promise<VoiceProcessor> {
  const [micTrack] = source.getAudioTracks()
  if (!micTrack) {
    // No microphone at all — nothing to process and nothing to send.
    throw new Error('No audio track on the source stream')
  }

  let Tone: typeof import('tone')
  try {
    Tone = await import('tone')
  } catch (err) {
    return passthrough(micTrack, `audio library failed to load (${describe(err)})`)
  }

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

    const shift = new Tone.PitchShift({
      pitch: semitones,
      // Small window keeps latency low enough for conversation; the artefacts
      // it introduces are far less disruptive on a call than lag.
      windowSize: 0.05,
    })

    // Tone nodes sit on Tone's own graph, so bridge in and out of raw WebAudio.
    Tone.connect(input, shift)
    Tone.connect(shift, destination)

    const [outTrack] = destination.stream.getAudioTracks()
    if (!outTrack) {
      try { shift.dispose() } catch {}
      return passthrough(micTrack, 'the processed stream produced no audio track')
    }

    let disposed = false
    return {
      track: outTrack,
      active: true,
      dispose: async () => {
        if (disposed) return
        disposed = true
        try { shift.disconnect(); shift.dispose() } catch {}
        try { input.disconnect() } catch {}
        try { destination.disconnect() } catch {}
        // The mic track is the caller's — only the processed one is ours.
        try { outTrack.stop() } catch {}
      },
    }
  } catch (err) {
    console.warn('[voice] pitch shift unavailable, sending the raw mic', err)
    return passthrough(micTrack, describe(err))
  }
}

export { passthrough as rawVoiceProcessor }
