/**
 * Pitch-shifts an outgoing microphone stream for web calls.
 *
 * Browser-only: it touches AudioContext and MediaStream, so it must never be
 * imported at module scope from a server component — load it with a dynamic
 * import inside the call UI.
 *
 * The contract is deliberately forgiving. A call is more important than an
 * effect, so every failure path returns the untouched microphone track rather
 * than throwing: a missing AudioContext, a Tone.js chunk that will not load, a
 * browser that gives us no track. The caller can always send what it gets back.
 */

export interface VoiceProcessor {
  /** The track to send. Either processed, or the raw mic if processing failed. */
  readonly track: MediaStreamTrack
  /** False when we fell back to the raw mic, so the UI can stay honest. */
  readonly active: boolean
  /** Releases the AudioContext and every node. Safe to call more than once. */
  dispose: () => Promise<void>
}

/** A no-op processor wrapping the unmodified microphone. */
function passthrough(track: MediaStreamTrack): VoiceProcessor {
  return { track, active: false, dispose: async () => {} }
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

  try {
    const Tone = await import('tone')

    // Tone starts suspended until a user gesture; a call always begins with
    // one (the Call button), so this resolves immediately in practice.
    await Tone.start()

    const ctx = Tone.getContext()
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
    if (!outTrack) throw new Error('Processing produced no audio track')

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
    return passthrough(micTrack)
  }
}

export { passthrough as rawVoiceProcessor }
