import { useState, useRef } from 'react';

export interface WebRTCState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isCalling: boolean;
  isReceivingCall: boolean;
  activeConversationId: string | null;
  callerUsername: string | null;
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
    callerUsername: null
  });

  const peerConnection = useRef<RTCPeerConnection | null>(null);

  const startMedia = async (video: boolean) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio: true });
      setState(s => ({ ...s, localStream: stream }));
      return stream;
    } catch (err) {
      console.error('Failed to access media devices.', err);
      return null;
    }
  };

  const createPeerConnection = (conversationId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
      ]
    });

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

    setState(s => ({ ...s, isCalling: true, activeConversationId: conversationId }));
    const pc = createPeerConnection(conversationId);
    
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    sendSignal(conversationId, 'callOffer', offer);
  };

  const handleIncomingCall = (conversationId: string, callerName: string, offer: RTCSessionDescriptionInit) => {
    setState(s => ({ ...s, isReceivingCall: true, activeConversationId: conversationId, callerUsername: callerName }));
    // We store the offer in a ref to use it when accepting
    window._pendingWebRTCOffer = offer; 
  };

  const acceptCall = async (video: boolean) => {
    if (!state.activeConversationId || !window._pendingWebRTCOffer) return;
    
    const stream = await startMedia(video);
    if (!stream) return;

    setState(s => ({ ...s, isReceivingCall: false, isCalling: true }));
    const pc = createPeerConnection(state.activeConversationId);
    
    stream.getTracks().forEach(track => pc.addTrack(track, stream));
    
    await pc.setRemoteDescription(new RTCSessionDescription(window._pendingWebRTCOffer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    sendSignal(state.activeConversationId, 'callAnswer', answer);
    window._pendingWebRTCOffer = null;
  };

  const rejectCall = () => {
    if (state.activeConversationId) {
      sendSignal(state.activeConversationId, 'rejectCall', {});
    }
    setState(s => ({ ...s, isReceivingCall: false, activeConversationId: null, callerUsername: null }));
    window._pendingWebRTCOffer = null;
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (peerConnection.current) {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
    }
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    if (peerConnection.current) {
      try {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error('Error adding received ice candidate', e);
      }
    }
  };

  const endCall = () => {
    if (state.activeConversationId) {
      sendSignal(state.activeConversationId, 'endCall', {});
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (state.localStream) {
      state.localStream.getTracks().forEach(track => track.stop());
    }
    setState({
      localStream: null,
      remoteStream: null,
      isCalling: false,
      isReceivingCall: false,
      activeConversationId: null,
      callerUsername: null
    });
  };

  const handleEndCallSignal = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (state.localStream) {
      state.localStream.getTracks().forEach(track => track.stop());
    }
    setState({
      localStream: null,
      remoteStream: null,
      isCalling: false,
      isReceivingCall: false,
      activeConversationId: null,
      callerUsername: null
    });
  };

  const toggleMute = () => {
    if (state.localStream) {
      const audioTrack = state.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setState(s => ({ ...s }));
      }
    }
  };

  const toggleVideo = () => {
    if (state.localStream) {
      const videoTrack = state.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setState(s => ({ ...s }));
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
    toggleVideo,
    isAudioMuted: state.localStream ? !state.localStream.getAudioTracks()[0]?.enabled : false,
    isVideoOff: state.localStream ? !state.localStream.getVideoTracks()[0]?.enabled : false
  };
}

declare global {
  interface Window {
    _pendingWebRTCOffer: RTCSessionDescriptionInit | null;
  }
}
