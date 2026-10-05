'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { callApi, meApi } from '@/lib/api'
import type { VoiceProcessor } from '@/lib/voice/voiceProcessor'
import { useAuthStore } from '@/lib/store/auth'
import { triggerPlanModal } from '@/components/NoPlanModal'

type CallStatus = 'loading' | 'ringing' | 'connecting' | 'connected' | 'ended' | 'failed'

/** Used only until the server's TURN list arrives. */
const FALLBACK_ICE: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
]

/**
 * The API stores SDP as a JSON column, so it comes back as an object — but
 * older rows can be a string, or even a doubly-encoded one. Unwrap up to three
 * times, the same way the mobile client does.
 */
function parseSdp(raw: unknown): { type: string; sdp: string } | null {
  let val: any = raw
  for (let i = 0; i < 3 && typeof val === 'string'; i++) {
    try { val = JSON.parse(val) } catch { break }
  }
  return val && typeof val === 'object' && val.type && val.sdp
    ? { type: val.type, sdp: val.sdp }
    : null
}

export default function CallPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { token } = useAuthStore()

  const callIdParam = params.id as string              // "new" or actual callId
  const isNew = callIdParam === 'new'
  const targetUserId = Number(searchParams.get('to'))   // for new calls
  const callType = (searchParams.get('type') || 'video') as 'audio' | 'video'
  const role = searchParams.get('role') ?? (isNew ? 'caller' : 'callee')
  const isVideo = callType === 'video'

  const [status, setStatus] = useState<CallStatus>('loading')
  const [callId, setCallId] = useState<number | null>(isNew ? null : Number(callIdParam))
  const [otherUser, setOtherUser] = useState<any>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isCamOff, setIsCamOff] = useState(false)
  const [otherMuted, setOtherMuted] = useState(false)
  // Whether THIS call may use the effect at all. The server answers on
  // initiate; the client never decides for itself.
  const [voiceAllowed, setVoiceAllowed] = useState(false)
  const [voiceOn, setVoiceOn] = useState(false)
  const [voiceBusy, setVoiceBusy] = useState(false)
  const [duration, setDuration] = useState(0)
  const [statusText, setStatusText] = useState('Connecting…')

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const callIdRef = useRef<number | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const endedRef = useRef(false)
  const iceServersRef = useRef<RTCIceServer[]>(FALLBACK_ICE)
  // Cursor for /signaling?ice_after=N — the server sends only newer candidates.
  const lastIceRef = useRef(-1)
  const remoteSetRef = useRef(false)
  // addIceCandidate() throws before a remote description exists, so hold them.
  const pendingIceRef = useRef<any[]>([])
  const durationValRef = useRef(0)
  const voiceProcRef = useRef<VoiceProcessor | null>(null)
  const audioSenderRef = useRef<RTCRtpSender | null>(null)
  const semitonesRef = useRef(5)

  const cleanup = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    if (durationRef.current) clearInterval(durationRef.current)
    voiceProcRef.current?.dispose()
    voiceProcRef.current = null
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    pcRef.current?.close()
    pcRef.current = null
    localStreamRef.current = null
  }, [])

  useEffect(() => {
    init()
    return () => { endedRef.current = true; cleanup() }
  }, [])

  async function init() {
    try {
      // TURN comes from the server. Google STUN alone cannot traverse carrier
      // NAT, which is why web-to-app calls died the moment either side was on
      // mobile data. Falling back to STUN keeps same-network calls working if
      // the endpoint is unreachable.
      try {
        const servers = await callApi.iceServers(token!)
        if (servers.length) iceServersRef.current = servers
      } catch {
        console.warn('[call] ice-servers unavailable — falling back to STUN only')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideo,
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
      localStreamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
        localVideoRef.current.muted = true
      }

      if (role === 'caller') {
        await startCaller(stream)
      } else {
        await startCallee(stream)
      }
    } catch (err: any) {
      if (err?.name === 'NotAllowedError' || err?.name === 'NotFoundError') {
        toast.error(err?.name === 'NotFoundError' ? 'No microphone found' : 'Camera/microphone permission denied')
        setStatus('failed')
        setStatusText(err?.name === 'NotFoundError' ? 'No mic or camera available' : 'Permission denied — allow camera/mic and try again')
      } else if (err?.status === 402 || err?.needPlan) {
        triggerPlanModal('call')
        router.back()
        return
      } else {
        toast.error(err?.message || 'Failed to start call')
        setStatus('failed')
        setStatusText('Something went wrong')
      }
    }
  }

  function createPC(stream: MediaStream) {
    const pc = new RTCPeerConnection({ iceServers: iceServersRef.current })
    stream.getTracks().forEach(t => {
      const sender = pc.addTrack(t, stream)
      // Held so the effect can be swapped in and out with replaceTrack(),
      // which needs no renegotiation and so cannot interrupt the call.
      if (t.kind === 'audio') audioSenderRef.current = sender
    })

    pc.ontrack = (e) => {
      if (remoteVideoRef.current && e.streams[0]) {
        remoteVideoRef.current.srcObject = e.streams[0]
      }
    }

    pc.onicecandidate = async (e) => {
      if (e.candidate && callIdRef.current) {
        try {
          await callApi.addIceCandidate(token!, callIdRef.current, e.candidate.toJSON())
        } catch {}
      }
    }

    pc.onconnectionstatechange = () => {
      if (endedRef.current) return
      if (pc.connectionState === 'connected') {
        setStatus('connected')
        setStatusText('Connected')
        startDurationTimer()
      }
      if (pc.connectionState === 'failed') {
        setStatusText('Connection failed')
        endCall()
      }
      if (pc.connectionState === 'disconnected') {
        endCall()
      }
    }

    pcRef.current = pc
    return pc
  }

  async function startCaller(stream: MediaStream) {
    setStatus('ringing')
    setStatusText('Calling…')

    const pc = createPC(stream)
    const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: isVideo })
    await pc.setLocalDescription(offer)

    // Ring first, then post the SDP. The initiate endpoint does not read an
    // offer from its body — the offer only lands via /offer, keyed by call id.
    const res = await callApi.initiate(token!, targetUserId, callType)
    const call = res?.call ?? res
    if (!call?.id) throw new Error('Could not start the call')

    callIdRef.current = call.id
    setCallId(call.id)
    setOtherUser(call.receiver ?? null)

    await callApi.sendOffer(token!, call.id, { type: offer.type, sdp: offer.sdp! })

    // The toggle exists only when the server authorised it for THIS call --
    // kill switch on, admin grant held, and the callee's app able to show the
    // disclosure badge. Anything else and the control never appears.
    if (res?.voice_effect_allowed) {
      try {
        const f = await meApi.features(token!)
        semitonesRef.current = f.voice_changer_semitones ?? 5
      } catch { /* the default shift is fine */ }
      setVoiceAllowed(true)
    }

    startSignalingPoll(call.id)
  }

  async function startCallee(stream: MediaStream) {
    const cId = Number(callIdParam)
    callIdRef.current = cId
    setCallId(cId)
    setStatus('connecting')
    setStatusText('Connecting…')

    createPC(stream)
    await callApi.answer(token!, cId)
    startSignalingPoll(cId)
  }

  /**
   * One poll loop for both roles, mirroring CallScreen.js.
   *
   * The server hands back only ICE candidates newer than `ice_after` and tells
   * us the new cursor in `ice_total`. Candidates are buffered until the remote
   * description exists, because addIceCandidate() throws before that.
   */
  function startSignalingPoll(cId: number) {
    const tick = async () => {
      if (endedRef.current) return
      const pc = pcRef.current
      if (!pc) return

      try {
        const res = await callApi.signaling(token!, cId, lastIceRef.current)

        if (res.status === 'declined' || res.status === 'missed') {
          setStatus('ended')
          setStatusText(res.status === 'declined' ? 'Call declined' : 'No answer')
          endCall(false)
          return
        }
        if (res.status === 'completed') {
          endCall(false)
          return
        }

        // ── Remote SDP ──
        if (!remoteSetRef.current) {
          const raw = role === 'caller' ? res.answer_sdp : res.offer_sdp
          const sdp = parseSdp(raw)
          if (sdp) {
            await pc.setRemoteDescription(sdp as RTCSessionDescriptionInit)
            remoteSetRef.current = true
            setStatus('connecting')
            setStatusText('Connecting…')

            // Callee answers only once it has the caller's offer.
            if (role === 'callee') {
              const answer = await pc.createAnswer()
              await pc.setLocalDescription(answer)
              await callApi.answerSdp(token!, cId, { type: answer.type, sdp: answer.sdp! })
            }

            for (const c of pendingIceRef.current.splice(0)) {
              try { await pc.addIceCandidate(new RTCIceCandidate(c)) } catch {}
            }
          }
        }

        // ── New ICE candidates ──
        if (Array.isArray(res.candidates) && res.candidates.length) {
          for (const c of res.candidates) {
            if (remoteSetRef.current) {
              try { await pc.addIceCandidate(new RTCIceCandidate(c)) } catch {}
            } else {
              pendingIceRef.current.push(c)
            }
          }
          if (typeof res.ice_total === 'number' && res.ice_total > 0) {
            lastIceRef.current = res.ice_total - 1
          }
        }

        if (typeof res.is_other_muted === 'boolean') setOtherMuted(res.is_other_muted)
      } catch {
        // A dropped poll is normal on a flaky network — the next tick retries.
      }
    }

    tick()
    pollRef.current = setInterval(tick, 1500)
  }

  function startDurationTimer() {
    if (durationRef.current) return   // connectionstatechange can fire twice
    durationRef.current = setInterval(() => {
      durationValRef.current += 1
      setDuration(durationValRef.current)
    }, 1000)
  }

  async function endCall(sendComplete = true) {
    if (endedRef.current) return
    endedRef.current = true
    clearInterval(pollRef.current!)
    clearInterval(durationRef.current!)
    if (sendComplete && callIdRef.current) {
      // Duration is what the server bills and shows in history — the old call
      // sent none, so every web call was logged as 0 seconds.
      try { await callApi.end(token!, callIdRef.current, durationValRef.current) } catch {}
    }
    cleanup()
    setStatus('ended')
    setStatusText('Call ended')
    setTimeout(() => router.back(), 2000)
  }

  function toggleMute() {
    const stream = localStreamRef.current
    if (!stream) return
    const next = !isMuted
    stream.getAudioTracks().forEach(t => { t.enabled = !next })
    setIsMuted(next)
    // Tell the other side, so their UI can show the muted badge.
    if (callIdRef.current) {
      callApi.mute(token!, callIdRef.current, next).catch(() => {})
    }
  }

  /**
   * Swap the outgoing audio track between the raw mic and a pitch-shifted one.
   *
   * The server is told first: if it refuses -- permission revoked mid-call, or
   * the kill switch thrown -- nothing is swapped and the caller keeps sending
   * their own voice. The effect is never audible without the callee's badge,
   * which they render from the same server state.
   */
  async function toggleVoiceEffect() {
    const sender = audioSenderRef.current
    const stream = localStreamRef.current
    if (!sender || !stream || !callIdRef.current || voiceBusy) return

    const next = !voiceOn
    setVoiceBusy(true)
    try {
      await callApi.voiceEffect(token!, callIdRef.current, next)

      if (next) {
        const { createVoiceProcessor } = await import('@/lib/voice/voiceProcessor')
        const proc = await createVoiceProcessor(stream, semitonesRef.current)
        voiceProcRef.current = proc
        await sender.replaceTrack(proc.track)
        if (!proc.active) {
          // Processing failed and we are sending the raw mic. Say so, and tell
          // the server, so the callee is not shown a badge for nothing.
          toast.error('Voice effect could not start — sending your normal voice')
          await callApi.voiceEffect(token!, callIdRef.current, false).catch(() => {})
          setVoiceOn(false)
          return
        }
        setVoiceOn(true)
      } else {
        const [mic] = stream.getAudioTracks()
        if (mic) await sender.replaceTrack(mic)
        await voiceProcRef.current?.dispose()
        voiceProcRef.current = null
        setVoiceOn(false)
      }
    } catch (err) {
      const e = err as { status?: number }
      toast.error(e?.status === 403
        ? 'Voice effect is not available on this call'
        : 'Could not change the voice effect')
      setVoiceOn(false)
    } finally {
      setVoiceBusy(false)
    }
  }

  function toggleCamera() {
    const stream = localStreamRef.current
    if (!stream) return
    const next = !isCamOff
    stream.getVideoTracks().forEach(t => { t.enabled = !next })
    setIsCamOff(next)
    if (callIdRef.current) {
      callApi.camera(token!, callIdRef.current, next).catch(() => {})
    }
  }

  function formatDuration(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  const otherName = otherUser?.name ?? (role === 'caller' ? 'Calling…' : 'Incoming call')
  const otherPhoto = otherUser?.photo

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col" style={{ zIndex: 100 }}>
      {/* Remote video / audio background */}
      {isVideo ? (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 gradient-brand opacity-80" />
      )}

      {/* Dark overlay for audio calls or when video not connected */}
      {(!isVideo || status !== 'connected') && (
        <div className="absolute inset-0 bg-black/40" />
      )}

      {/* Other user info */}
      <div className="relative z-10 flex flex-col items-center pt-20 gap-4">
        {otherPhoto ? (
          <img src={otherPhoto} alt={otherName} className="w-24 h-24 rounded-full object-cover border-4 border-white/30" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-4xl font-bold text-white border-4 border-white/20">
            {otherName?.[0]?.toUpperCase() ?? '?'}
          </div>
        )}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">{otherName}</h2>
          <p className="text-white/70 text-sm mt-1 capitalize">
            {status === 'connected' ? formatDuration(duration) : statusText}
          </p>
          {voiceOn && (
            <p className="text-amber-300 text-xs mt-2 flex items-center justify-center gap-1.5 font-semibold">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 23h8" />
              </svg>
              Voice effect ON — {otherName} can see this
            </p>
          )}
          {status === 'connected' && otherMuted && (
            <p className="text-white/60 text-xs mt-1 flex items-center justify-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23M12 19v3M8 23h8" />
              </svg>
              {otherName} is muted
            </p>
          )}
        </div>
      </div>

      {/* Local video (PiP) */}
      {isVideo && (
        <div className="absolute right-4 top-24 w-28 h-40 rounded-2xl overflow-hidden border-2 border-white/30 z-20" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {isCamOff && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h1a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56" />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* Audio-only local video ref (hidden) */}
      {!isVideo && <video ref={localVideoRef} autoPlay playsInline muted className="hidden" />}

      {/* Status/failed overlay */}
      {(status === 'ended' || status === 'failed') && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/60">
          <div className="text-center space-y-3">
            <div className="text-5xl">{status === 'failed' ? '❌' : '📵'}</div>
            <p className="text-white font-bold text-lg">{statusText}</p>
            <button onClick={() => router.back()} className="mt-2 px-6 py-2.5 rounded-xl bg-white text-gray-900 font-semibold text-sm">
              Go Back
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      {status !== 'ended' && status !== 'failed' && (
        <div className="absolute bottom-12 left-0 right-0 z-20 flex items-center justify-center gap-6">
          {/* Mute */}
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500' : 'bg-white/20 hover:bg-white/30'}`}>
            {isMuted ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23M12 19v3M8 23h8" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 23h8" />
              </svg>
            )}
          </button>

          {/* End call */}
          <button
            onClick={() => endCall(true)}
            className="w-18 h-18 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all active:scale-95" style={{ width: 72, height: 72 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="0">
              <path d="M10.68 13.31a16 16 0 003.41 2.6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7 2 2 0 011.72 2v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.42 19.42 0 013.43 9.19 19.79 19.79 0 01.36 2.56 2 2 0 012 .18 2 2 0 014.18 2v3a2 2 0 001.72 2 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L4.88 13.19a16 16 0 005.8.12z" transform="rotate(135 12 12)" />
            </svg>
          </button>

          {/* Voice effect — only when the server authorised it for this call */}
          {voiceAllowed && (
            <button
              onClick={toggleVoiceEffect}
              disabled={voiceBusy}
              title={voiceOn ? 'Turn the voice effect off' : 'Turn the voice effect on'}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all disabled:opacity-50 ${
                voiceOn ? 'bg-amber-500' : 'bg-white/20 hover:bg-white/30'
              }`}>
              {voiceBusy ? (
                <span className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 23h8" />
                </svg>
              )}
            </button>
          )}

          {/* Camera toggle (video only) */}
          {isVideo ? (
            <button
              onClick={toggleCamera}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isCamOff ? 'bg-red-500' : 'bg-white/20 hover:bg-white/30'}`}>
              {isCamOff ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <line x1="1" y1="1" x2="23" y2="23" />
                  <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h1a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              )}
            </button>
          ) : (
            <div className="w-14 h-14" /> /* spacer */
          )}
        </div>
      )}

      {/* Call type label */}
      <div className="absolute top-6 left-0 right-0 flex justify-center z-10">
        <div className="flex items-center gap-1.5 bg-black/30 rounded-full px-3 py-1">
          {isVideo ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 3.07 10.8 19.79 19.79 0 0 1 .22 2.18 2 2 0 0 1 2.18 0h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L6.91 7.91a16 16 0 0 0 6.18 6.18l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          )}
          <span className="text-white text-xs font-medium capitalize">{callType} call</span>
        </div>
      </div>
    </div>
  )
}
