import { useState, useRef, useEffect } from 'react';

export interface WebRTCState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isCalling: boolean;
  isReceivingCall: boolean;
  activeConversationId: string | null;
  callerUsername: string | null;
  isVideoCall: boolean;
  isAudioMuted: boolean;
  isVideoOff: boolean;
}

export function useWebRTC(
  sendSignal: (conversationId: string, signalType: string, data: any) => void
) {
  const [state, setState] = useState<WebRTCState>({
    localStream: null,
    remoteStream: null,
    isCalling: false,
    isReceivingCall: false,
    activeConversationId: null,
    callerUsername: null,
    isVideoCall: true,
    isAudioMuted: false,
    isVideoOff: false
  });

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const pendingOffer = useRef<RTCSessionDescriptionInit | null>(null);
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);
  
  // Refs for stale closures in endCall
  const activeConversationIdRef = useRef<string | null>(state.activeConversationId);
  const localStreamRef = useRef<MediaStream | null>(state.localStream);

  useEffect(() => {
    activeConversationIdRef.current = state.activeConversationId;
  }, [state.activeConversationId]);

  useEffect(() => {
    localStreamRef.current = state.localStream;
  }, [state.localStream]);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (state.isCalling && !state.remoteStream) {
      timeoutRef.current = setTimeout(() => {
        endCall();
        alert("Call timed out: the other person didn't answer.");
      }, 30000);
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [state.isCalling, state.remoteStream]);

  const startMedia = async (video: boolean) => {
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!video) {
          const videoTrack = stream.getVideoTracks()[0];
          if (videoTrack) {
            videoTrack.enabled = false;
          }
        }
      } catch (err) {
        if (!video) {
          stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        } else {
          throw err;
        }
      }
      setState(s => ({
        ...s,
        localStream: stream,
        isAudioMuted: stream.getAudioTracks()[0] ? !stream.getAudioTracks()[0].enabled : false,
        isVideoOff: stream.getVideoTracks()[0] ? !stream.getVideoTracks()[0].enabled : true
      }));
      return stream;
    } catch (err) {
      console.error('Failed to access media devices.', err);
      return null;
    }
  };

  const createPeerConnection = (conversationId: string) => {
    const iceServers: RTCIceServer[] = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ];

    const turnUrl = import.meta.env.VITE_TURN_URL;
    const turnUsername = import.meta.env.VITE_TURN_USERNAME;
    const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL;
    
    if (turnUrl) {
      const turnServer: RTCIceServer = { urls: turnUrl };
      if (turnUsername) turnServer.username = turnUsername;
      if (turnCredential) turnServer.credential = turnCredential;
      iceServers.push(turnServer);
    }

    const pc = new RTCPeerConnection({ iceServers });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal(conversationId, 'iceCandidate', event.candidate);
      }
    };

    pc.ontrack = (event) => {
      setState(s => ({ ...s, remoteStream: event.streams[0] }));
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        endCall();
      }
    };

    peerConnection.current = pc;
    return pc;
  };

  const startCall = async (conversationId: string, video: boolean) => {
    const stream = await startMedia(video);
    if (!stream) return;

    setState(s => ({ 
      ...s, 
      isCalling: true, 
      activeConversationId: conversationId,
      isVideoCall: video,
      isAudioMuted: stream.getAudioTracks()[0] ? !stream.getAudioTracks()[0].enabled : false,
      isVideoOff: stream.getVideoTracks()[0] ? !stream.getVideoTracks()[0].enabled : true
    }));
    const pc = createPeerConnection(conversationId);
    
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    sendSignal(conversationId, 'callOffer', { offer, isVideoCall: video });
  };

  const handleIncomingCall = (conversationId: string, callerName: string, offerData: any) => {
    const offer = offerData?.offer || offerData;
    const isVideoCall = offerData?.isVideoCall !== undefined ? offerData.isVideoCall : true;

    setState(s => ({ 
      ...s, 
      isReceivingCall: true, 
      activeConversationId: conversationId, 
      callerUsername: callerName,
      isVideoCall
    }));
    // We store the offer in a ref to use it when accepting
    pendingOffer.current = offer; 
  };

  const acceptCall = async (video: boolean) => {
    if (!state.activeConversationId || !pendingOffer.current) return;
    
    const stream = await startMedia(video);
    if (!stream) return;

    setState(s => ({ 
      ...s, 
      isReceivingCall: false, 
      isCalling: true,
      isAudioMuted: stream.getAudioTracks()[0] ? !stream.getAudioTracks()[0].enabled : false,
      isVideoOff: stream.getVideoTracks()[0] ? !stream.getVideoTracks()[0].enabled : true
    }));
    const pc = createPeerConnection(state.activeConversationId);
    
    stream.getTracks().forEach(track => pc.addTrack(track, stream));
    
    await pc.setRemoteDescription(new RTCSessionDescription(pendingOffer.current));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    // Process queued candidates
    for (const candidate of iceCandidateQueue.current) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error('Error adding queued ice candidate', e);
      }
    }
    iceCandidateQueue.current = [];

    sendSignal(state.activeConversationId, 'callAnswer', answer);
    pendingOffer.current = null;
  };

  const rejectCall = () => {
    if (state.activeConversationId) {
      sendSignal(state.activeConversationId, 'rejectCall', {});
    }
    setState(s => ({ ...s, isReceivingCall: false, activeConversationId: null, callerUsername: null }));
    pendingOffer.current = null;
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (peerConnection.current) {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
      
      // Process queued candidates
      for (const candidate of iceCandidateQueue.current) {
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding queued ice candidate', e);
        }
      }
      iceCandidateQueue.current = [];
    }
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    if (peerConnection.current) {
      if (!peerConnection.current.remoteDescription) {
        iceCandidateQueue.current.push(candidate);
      } else {
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding received ice candidate', e);
        }
      }
    } else {
      iceCandidateQueue.current.push(candidate);
    }
  };

  const endCall = () => {
    if (activeConversationIdRef.current) {
      sendSignal(activeConversationIdRef.current, 'endCall', {});
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    iceCandidateQueue.current = [];
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    setState({
      localStream: null,
      remoteStream: null,
      isCalling: false,
      isReceivingCall: false,
      activeConversationId: null,
      callerUsername: null,
      isVideoCall: true,
      isAudioMuted: false,
      isVideoOff: false
    });
  };

  const handleEndCallSignal = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    iceCandidateQueue.current = [];
    if (state.localStream) {
      state.localStream.getTracks().forEach(track => track.stop());
    }
    setState({
      localStream: null,
      remoteStream: null,
      isCalling: false,
      isReceivingCall: false,
      activeConversationId: null,
      callerUsername: null,
      isVideoCall: true,
      isAudioMuted: false,
      isVideoOff: false
    });
  };

  const toggleMute = () => {
    if (state.localStream) {
      const audioTrack = state.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setState(s => ({ ...s, isAudioMuted: !audioTrack.enabled }));
      }
    }
  };

  const toggleVideo = () => {
    if (state.localStream) {
      const videoTrack = state.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setState(s => ({ ...s, isVideoOff: !videoTrack.enabled }));
      }
    }
  };

  return {
    ...state,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    handleAnswer,
    handleIncomingCall,
    handleIceCandidate,
    handleEndCallSignal,
    toggleMute,
    toggleVideo
  };
}

