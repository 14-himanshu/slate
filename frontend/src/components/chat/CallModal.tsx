import { useEffect, useRef } from 'react';
import { Icon, Icons } from '../ui';

interface CallModalProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isAudioMuted: boolean;
  isVideoOff: boolean;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
}

function ControlBtn({
  icon, label, active, danger, onClick
}: {
  icon: string;
  label: string;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <button
        onClick={onClick}
        title={label}
        style={{
          width: 52, height: 52, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: active ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.5)',
          color: active ? '#000' : '#fff',
          backdropFilter: 'blur(8px)',
          transition: 'all 0.15s',
          boxShadow: 'none',
        }}
        onMouseEnter={e => { 
            e.currentTarget.style.transform = 'scale(1.08)'; 
            if (danger) {
                e.currentTarget.style.background = 'var(--danger)'; 
                e.currentTarget.style.borderColor = 'var(--danger)'; 
                e.currentTarget.style.color = '#fff';
            } else {
                e.currentTarget.style.background = active ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.2)'; 
            }
        }}
        onMouseLeave={e => { 
            e.currentTarget.style.transform = 'scale(1)'; 
            e.currentTarget.style.background = active ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.5)'; 
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; 
            e.currentTarget.style.color = active ? '#000' : '#fff';
        }}
      >
        <Icon d={icon} size={22} color="currentColor" />
      </button>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 500, letterSpacing: '0.02em' }}>{label}</span>
    </div>
  );
}

export function CallModal({
  localStream, remoteStream,
  isAudioMuted, isVideoOff,
  onEndCall, onToggleMute, onToggleVideo
}: CallModalProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.9)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(12px)',
      animation: 'fadeIn 0.2s ease both',
    }}>
      <div style={{
        position: 'relative',
        width: '90%', maxWidth: 960,
        aspectRatio: '16/9',
        background: '#111',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-2xl)',
      }}>
        {/* Remote video */}
        <video
          ref={remoteVideoRef}
          autoPlay playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />

        {/* No remote stream placeholder */}
        {!remoteStream && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <Icon d={Icons.video} size={40} color="rgba(255,255,255,0.2)" />
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Waiting for the other person…</p>
          </div>
        )}

        {/* Local video — PiP */}
        <div style={{
          position: 'absolute', bottom: 90, right: 20,
          width: 180, aspectRatio: '16/9',
          background: '#222', borderRadius: 10,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          border: '2px solid rgba(255,255,255,0.12)',
        }}>
          <video
            ref={localVideoRef}
            autoPlay playsInline muted
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
          />
          {isVideoOff && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#222' }}>
              <Icon d={Icons.videoOff} size={24} color="rgba(255,255,255,0.3)" />
            </div>
          )}
        </div>

        {/* Controls bar */}
        <div style={{
          position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 20, alignItems: 'flex-end',
          padding: '14px 28px',
          background: 'rgba(0,0,0,0.55)',
          borderRadius: 40,
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <ControlBtn
            icon={isAudioMuted ? Icons.micOff : Icons.mic}
            label={isAudioMuted ? 'Unmute' : 'Mute'}
            active={isAudioMuted}
            onClick={onToggleMute}
          />
          <ControlBtn
            icon={isVideoOff ? Icons.videoOff : Icons.video}
            label={isVideoOff ? 'Start Video' : 'Stop Video'}
            active={isVideoOff}
            onClick={onToggleVideo}
          />
          <ControlBtn
            icon={Icons.phoneOff}
            label="End Call"
            danger
            onClick={onEndCall}
          />
        </div>
      </div>
    </div>
  );
}
