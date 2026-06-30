import { useEffect, useRef, useState } from 'react';
import { Icon, Icons } from '../ui';

interface CallModalProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isAudioMuted: boolean;
  isVideoOff: boolean;
  callerName?: string;
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
          background: danger ? 'var(--danger)' : active ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.5)',
          color: active ? '#000' : '#fff',
          border: danger ? 'none' : '1px solid rgba(255,255,255,0.2)',
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
  isAudioMuted, isVideoOff, callerName,
  onEndCall, onToggleMute, onToggleVideo
}: CallModalProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);

  // Draggable PiP state
  const pipRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (remoteStream) {
      timer = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [remoteStream]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const secs = s % 60;
    return `${m}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!pipRef.current) return;
    isDragging.current = true;
    const rect = pipRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    pipRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !pipRef.current) return;
    const x = e.clientX - dragOffset.current.x;
    const y = e.clientY - dragOffset.current.y;
    // Keep within bounds
    const parent = pipRef.current.parentElement;
    if (!parent) return;
    const parentRect = parent.getBoundingClientRect();
    const pipRect = pipRef.current.getBoundingClientRect();
    
    const minX = 0;
    const minY = 0;
    const maxX = parentRect.width - pipRect.width;
    const maxY = parentRect.height - pipRect.height;
    
    const boundedX = Math.max(minX, Math.min(x - parentRect.left, maxX));
    const boundedY = Math.max(minY, Math.min(y - parentRect.top, maxY));
    
    pipRef.current.style.right = 'auto';
    pipRef.current.style.bottom = 'auto';
    pipRef.current.style.left = `${boundedX}px`;
    pipRef.current.style.top = `${boundedY}px`;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    if (pipRef.current) {
        pipRef.current.releasePointerCapture(e.pointerId);
    }
  };

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(e => console.warn('Local video play failed:', e));
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(e => console.warn('Remote video play failed:', e));
    }
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
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Calling {callerName ? callerName : 'user'}…</p>
          </div>
        )}
        
        {/* Call Info Overlay */}
        {remoteStream && (
          <div style={{
            position: 'absolute', top: 24, left: 24,
            display: 'flex', flexDirection: 'column',
            textShadow: '0 2px 4px rgba(0,0,0,0.8)'
          }}>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#fff' }}>{callerName || 'Unknown User'}</h2>
            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)', animation: 'pulse 1.5s infinite' }} />
              {formatDuration(duration)}
            </div>
          </div>
        )}

        {/* Local video — PiP */}
        <div 
          ref={pipRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
          position: 'absolute', bottom: 90, right: 20,
          width: 180, aspectRatio: '16/9',
          background: '#222', borderRadius: 10,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          border: '2px solid rgba(255,255,255,0.12)',
          cursor: 'grab',
          touchAction: 'none'
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
