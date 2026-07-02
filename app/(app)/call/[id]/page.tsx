'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { callApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'

type CallStatus = 'loading' | 'ringing' | 'connecting' | 'connected' | 'ended' | 'failed'

const ICE_SERVERS: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
]

export default function CallPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { token, user } = useAuthStore()

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
  const [duration, setDuration] = useState(0)
  const [statusText, setStatusText] = useState('Connecting…')

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const callIdRef = useRef<number | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const seenCandidates = useRef<Set<string>>(new Set())
  const endedRef = useRef(false)

  const cleanup = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    if (durationRef.current) clearInterval(durationRef.current)
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
      const stream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true })
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
      if (err?.name === 'NotAllowedError') {
        toast.error('Camera/microphone permission denied')
      } else {
        toast.error('Failed to start call')
      }
      setStatus('failed')
      setStatusText('Could not access camera/microphone')
    }
  }

  function createPC(stream: MediaStream) {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    stream.getTracks().forEach(t => pc.addTrack(t, stream))

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
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
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

    const call = await callApi.initiate(token!, targetUserId, callType, JSON.stringify({ type: offer.type, sdp: offer.sdp }))
    callIdRef.current = call.id
    setCallId(call.id)
    setOtherUser(call.receiver)

    // Poll for answer
    pollRef.current = setInterval(async () => {
      if (endedRef.current) return
      try {
        const updated = await callApi.signaling(token!, call.id)
        setOtherUser(updated.receiver)

        if (updated.status === 'declined' || updated.status === 'missed') {
          clearInterval(pollRef.current!)
          setStatus('ended')
          setStatusText(updated.status === 'declined' ? 'Call declined' : 'No answer')
          return
        }

        if (updated.answer_sdp && !pc.remoteDescription) {
          const answer = JSON.parse(updated.answer_sdp)
          await pc.setRemoteDescription(answer)
          setStatus('connecting')
          setStatusText('Connecting…')
          // Switch to ICE poll
          clearInterval(pollRef.current!)
          startIcePoll(call.id)
        }
      } catch {}
    }, 2000)
  }

  async function startCallee(stream: MediaStream) {
    const cId = Number(callIdParam)
    const call = await callApi.signaling(token!, cId)
    callIdRef.current = cId
    setCallId(cId)
    setOtherUser(call.caller)
    setStatus('connecting')
    setStatusText('Connecting…')

    if (!call.offer_sdp) {
      toast.error('Call offer not found')
      setStatus('failed')
      return
    }

    const pc = createPC(stream)
    const offer = JSON.parse(call.offer_sdp)
    await pc.setRemoteDescription(offer)

    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    await callApi.answer(token!, cId)
    await callApi.answerSdp(token!, cId, JSON.stringify({ type: answer.type, sdp: answer.sdp }))

    // Add existing ICE candidates from caller
    if (call.ice_candidates) {
      const cands = JSON.parse(call.ice_candidates)
      for (const c of cands) {
        if (c.from !== user!.id) {
          const key = JSON.stringify(c.candidate)
          if (!seenCandidates.current.has(key)) {
            seenCandidates.current.add(key)
            try { await pc.addIceCandidate(c.candidate) } catch {}
          }
        }
      }
    }

    startIcePoll(cId)
  }

  function startIcePoll(cId: number) {
    pollRef.current = setInterval(async () => {
      if (endedRef.current) return
      try {
        const call = await callApi.signaling(token!, cId)
        if (call.ice_candidates) {
          const cands = JSON.parse(call.ice_candidates)
          for (const c of cands) {
            if (c.from !== user!.id) {
              const key = JSON.stringify(c.candidate)
              if (!seenCandidates.current.has(key)) {
                seenCandidates.current.add(key)
                try { await pcRef.current?.addIceCandidate(c.candidate) } catch {}
              }
            }
          }
        }
        // Stop polling if call ended remotely
        if (call.status === 'completed' || call.status === 'declined') {
          clearInterval(pollRef.current!)
          endCall(false)
        }
      } catch {}
    }, 2500)
  }

  function startDurationTimer() {
    durationRef.current = setInterval(() => {
      setDuration(d => d + 1)
    }, 1000)
  }

  async function endCall(sendComplete = true) {
    if (endedRef.current) return
    endedRef.current = true
    clearInterval(pollRef.current!)
    clearInterval(durationRef.current!)
    if (sendComplete && callIdRef.current) {
      try { await callApi.end(token!, callIdRef.current) } catch {}
    }
    cleanup()
    setStatus('ended')
    setStatusText('Call ended')
    setTimeout(() => router.back(), 2000)
  }

  function toggleMute() {
    const stream = localStreamRef.current
    if (!stream) return
    stream.getAudioTracks().forEach(t => { t.enabled = !t.enabled })
    setIsMuted(m => !m)
  }

  function toggleCamera() {
    const stream = localStreamRef.current
    if (!stream) return
    stream.getVideoTracks().forEach(t => { t.enabled = !t.enabled })
    setIsCamOff(c => !c)
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
