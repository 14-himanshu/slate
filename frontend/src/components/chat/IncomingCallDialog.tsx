import { useEffect } from 'react';
import { Avatar, Icon, Icons } from '../ui';

interface IncomingCallDialogProps {
  callerUsername: string | null;
  isVideoCall?: boolean;
  onAccept: (video: boolean) => void;
  onDecline: () => void;
}

export function IncomingCallDialog({ callerUsername, isVideoCall = true, onAccept, onDecline }: IncomingCallDialogProps) {
  useEffect(() => {
    let ctx: AudioContext | null = null;
    let osc: OscillatorNode | null = null;
    let gain: GainNode | null = null;
    let interval: ReturnType<typeof setInterval>;

    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      osc = ctx.createOscillator();
      gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = 440;
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      gain.gain.value = 0;
      osc.start();

      let isHigh = false;
      interval = setInterval(() => {
        if (gain && ctx) {
          gain.gain.setTargetAtTime(isHigh ? 0 : 0.1, ctx.currentTime, 0.05);
          osc!.frequency.setValueAtTime(isHigh ? 480 : 440, ctx.currentTime);
          isHigh = !isHigh;
        }
      }, 500);
    } catch (e) {
      console.warn('AudioContext not supported or blocked');
    }

    return () => {
      clearInterval(interval);
      if (gain && ctx) gain.gain.setValueAtTime(0, ctx.currentTime);
      if (osc) {
        try { osc.stop(); } catch(e) {}
        osc.disconnect();
      }
      if (gain) gain.disconnect();
      if (ctx && ctx.state !== 'closed') ctx.close();
    };
  }, []);

  if (!callerUsername) return null;

  return (
    <>
      {/* Backdrop blur */}
      <div style={{ position: 'fixed', inset: 0, backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.6)', zIndex: 9998 }} />

      <div style={{
        position: 'fixed',
        top: 24, left: '50%', transform: 'translateX(-50%)',
        background: 'var(--bg-elevated)',
        borderRadius: 16,
        padding: '16px 24px',
        display: 'flex', flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        gap: 32,
        boxShadow: 'var(--shadow-xl)',
        border: '1px solid var(--border)',
        zIndex: 9999,
        minWidth: 380,
        animation: 'slideInDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
      }}>
        {/* Caller info */}
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <Avatar name={callerUsername} size={48} circle />
            <div style={{
              position: 'absolute', inset: -4,
              borderRadius: '50%',
              border: '1.5px solid var(--accent)',
              animation: 'pulse-ring 2s ease infinite',
            }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {callerUsername}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500, margin: '2px 0 0 0' }}>
              {isVideoCall ? 'Incoming video call...' : 'Incoming audio call...'}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* Decline */}
          <button
            onClick={onDecline}
            title="Decline"
            style={{
              width: 44, height: 44, borderRadius: '50%', border: '1px solid var(--border)', cursor: 'pointer',
              background: 'var(--bg-hover)',
              color: 'var(--text-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.border = '1px solid var(--danger)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.border = '1px solid var(--border)'; }}
          >
            <Icon d={Icons.phoneOff} size={20} color="currentColor" />
          </button>

          {/* Accept */}
          <button
            onClick={() => onAccept(isVideoCall)}
            title="Accept"
            style={{
              width: 44, height: 44, borderRadius: '50%', border: '1px solid var(--border)', cursor: 'pointer',
              background: 'var(--bg-hover)',
              color: 'var(--text-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.background = 'var(--success)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.border = '1px solid var(--success)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.border = '1px solid var(--border)'; }}
          >
            <Icon d={isVideoCall ? Icons.video : Icons.phone} size={20} color="currentColor" />
          </button>
        </div>

        <style>{`
          @keyframes pulse-ring {
            0%   { opacity: 0.8; transform: scale(1); }
            50%  { opacity: 0.3; transform: scale(1.15); }
            100% { opacity: 0.8; transform: scale(1); }
          }
          @keyframes slideInDown {
            from { transform: translate(-50%, -100%); opacity: 0; }
            to   { transform: translate(-50%, 0); opacity: 1; }
          }
        `}</style>
      </div>
    </>
  );
}
