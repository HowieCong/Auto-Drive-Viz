import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { BoundingBox2D } from '../types';

interface VideoContainerProps {
  label: string;
  src: string;
  frame: number;
  totalFrames?: number;
  onTimeUpdate?: (t: number, f: number) => void;
  onDownload?: () => void;
  children: React.ReactNode;
  boxes?: BoundingBox2D[]; // Add boxes prop
}

export function VideoContainer({ 
  label, 
  src, 
  frame, 
  totalFrames = 20,
  onTimeUpdate, 
  onDownload,
  children,
  boxes = [] 
}: VideoContainerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [modalFrame, setModalFrame] = useState(frame);
  
  // Update modal frame when prop frame changes (if not playing in modal independently)
  useEffect(() => {
    if (!isModalOpen && frame !== modalFrame) {
      setModalFrame(frame);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, isModalOpen]);

  // Modal Animation Loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isModalOpen && isPlaying) {
      interval = setInterval(() => {
        setModalFrame(f => {
          const next = (f + 1) % totalFrames;
          // Sync back to parent if provided
          if (onTimeUpdate) onTimeUpdate(next * 0.1, next);
          return next;
        });
      }, 100 / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isModalOpen, isPlaying, playbackSpeed, totalFrames, onTimeUpdate]);

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      // Default download logic (download current image)
      const link = document.createElement('a');
      link.href = src; // This might need adjustment if src is dynamic
      link.download = `${label.replace(/\s+/g, '_')}_${modalFrame}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div style={{ position: 'relative', border: '1px solid #333', flexShrink: 0, background: '#000', display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar - Now outside video, above it */}
      <div style={{
        width: '100%',
        background: 'rgba(26, 26, 26, 1)', // Solid background
        borderBottom: '1px solid #333',
        padding: '5px 10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxSizing: 'border-box'
      }}>
        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>{label}</span>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#00ffff',
            cursor: 'pointer',
            fontSize: '16px',
            padding: 0,
            lineHeight: 1
          }}
          title="Open Player"
        >
          ⤢
        </button>
      </div>

      {/* Video Content (Preview) */}
      {children}

      {/* Modal */}
      {isModalOpen && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.9)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '80%',
            maxWidth: '1000px',
            background: '#1a1a1a',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid #333',
            boxShadow: '0 0 50px rgba(0,0,0,0.5)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '15px 20px',
              borderBottom: '1px solid #333',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, color: '#fff' }}>{label} - Player</h3>
              <button 
                onClick={() => { setIsModalOpen(false); setIsPlaying(false); }}
                style={{ background: 'none', border: 'none', color: '#888', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '20px', background: '#000', display: 'flex', justifyContent: 'center' }}>
               <div style={{ width: '100%', maxHeight: '60vh', display: 'flex', justifyContent: 'center', position: 'relative' }}>
                 <img 
                    src={src.replace(/frame=\d+/, `frame=${modalFrame}`)}
                    style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }}
                    alt="Full View"
                 />
                 
                 {/* Render 2D Boxes in Modal */}
                 <svg 
                    style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        width: '100%', 
                        height: '100%',
                        pointerEvents: 'none' 
                    }}
                    viewBox="0 0 1242 375" // Assuming KITTI resolution, ideally should be dynamic or percentage based
                    preserveAspectRatio="xMidYMid meet"
                 >
                    {boxes.map((box, idx) => (
                        <g key={idx}>
                            <rect
                                x={box.x}
                                y={box.y}
                                width={box.w}
                                height={box.h}
                                fill="none"
                                stroke="#00ff00"
                                strokeWidth="2"
                            />
                            <text
                                x={box.x}
                                y={box.y - 5}
                                fill="#00ff00"
                                fontSize="14"
                                fontWeight="bold"
                                style={{ textShadow: '1px 1px 2px black' }}
                            >
                                {box.label}
                            </text>
                        </g>
                    ))}
                 </svg>
               </div>
            </div>

            {/* Modal Controls */}
            <div style={{ padding: '20px', background: '#222' }}>
              
              {/* Progress Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <span style={{ color: '#888', fontSize: '12px', minWidth: '40px' }}>{modalFrame}</span>
                <input 
                  type="range" 
                  min={0} 
                  max={totalFrames - 1} 
                  value={modalFrame}
                  onChange={(e) => setModalFrame(parseInt(e.target.value))}
                  style={{ flex: 1, accentColor: '#00ffff', cursor: 'pointer' }}
                />
                <span style={{ color: '#888', fontSize: '12px', minWidth: '40px' }}>{totalFrames}</span>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    style={{
                      background: isPlaying ? '#ff4444' : '#44ff44',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '8px 20px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      color: '#000'
                    }}
                  >
                    {isPlaying ? 'PAUSE' : 'PLAY'}
                  </button>

                  <select 
                    value={playbackSpeed} 
                    onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                    style={{ background: '#333', color: '#fff', border: '1px solid #555', padding: '5px', borderRadius: '4px' }}
                  >
                    <option value="0.5">0.5x</option>
                    <option value="1">1.0x</option>
                    <option value="2">2.0x</option>
                  </select>
                </div>

                <button 
                  onClick={handleDownload}
                  style={{
                    background: '#333',
                    border: '1px solid #555',
                    color: '#fff',
                    padding: '8px 15px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <span>⬇</span> Download Frame
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
