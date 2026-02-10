import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';

interface VoiceMessagePlayerProps {
  src: string;
  duration?: number;
  isMine: boolean;
}

// Generate pseudo-random waveform bars from a seed (consistent per message)
const generateWaveform = (count: number, seed: string): number[] => {
  const bars: number[] = [];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  for (let i = 0; i < count; i++) {
    hash = ((hash << 5) - hash + i * 7) | 0;
    const normalized = (Math.abs(hash) % 100) / 100;
    bars.push(0.15 + normalized * 0.85);
  }
  return bars;
};

const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const PLAYBACK_SPEEDS = [1, 1.5, 2];

const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({ src, duration: initialDuration, isMine }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [speedIndex, setSpeedIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);

  const waveformBars = useRef(generateWaveform(32, src)).current;
  const speed = PLAYBACK_SPEEDS[speedIndex];
  const progress = duration > 0 ? currentTime / duration : 0;

  // Create audio element once
  useEffect(() => {
    const audio = new Audio(src);
    audio.preload = 'metadata';
    audioRef.current = audio;

    const onLoaded = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
      setIsLoaded(true);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      cancelAnimationFrame(animFrameRef.current);
    };

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended', onEnded);
      audio.pause();
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [src]);

  // RAF-based time tracking for smooth progress
  const updateTime = useCallback(() => {
    if (audioRef.current && !isSeeking) {
      setCurrentTime(audioRef.current.currentTime);
    }
    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(updateTime);
    }
  }, [isPlaying, isSeeking]);

  useEffect(() => {
    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(updateTime);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying, updateTime]);

  // Sync playback speed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn('Audio play failed:', err);
      }
    }
  };

  const toggleSpeed = () => {
    setSpeedIndex((prev) => (prev + 1) % PLAYBACK_SPEEDS.length);
  };

  // Seek via click/touch on waveform
  const seekFromEvent = (clientX: number) => {
    const el = progressRef.current;
    const audio = audioRef.current;
    if (!el || !audio || !duration) return;

    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newTime = ratio * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsSeeking(true);
    seekFromEvent(e.clientX);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isSeeking) {
      seekFromEvent(e.clientX);
    }
  };

  const handlePointerUp = () => {
    setIsSeeking(false);
  };

  // Colors based on sender
  const playBtnClass = isMine
    ? 'bg-black/20 text-black hover:bg-black/30'
    : 'bg-[#00FF00]/15 text-[#00FF00] hover:bg-[#00FF00]/25';
  const playIconColor = isMine ? 'text-black' : 'text-[#00FF00]';
  const barActiveColor = isMine ? 'bg-black/60' : 'bg-[#00FF00]';
  const barInactiveColor = isMine ? 'bg-black/20' : 'bg-zinc-600';
  const timeColor = isMine ? 'text-black/50' : 'text-zinc-500';
  const speedBtnClass = isMine
    ? 'bg-black/15 text-black/70 hover:bg-black/25'
    : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600';

  const displayTime = isPlaying || currentTime > 0
    ? formatDuration(currentTime)
    : formatDuration(duration);

  return (
    <div className="flex items-center gap-2.5 min-w-[200px] max-w-[260px] select-none">
      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-95 ${playBtnClass}`}
      >
        {isPlaying ? (
          <Pause size={18} className={playIconColor} fill="currentColor" />
        ) : (
          <Play size={18} className={`${playIconColor} ml-0.5`} fill="currentColor" />
        )}
      </button>

      {/* Waveform + Time */}
      <div className="flex-1 min-w-0">
        {/* Waveform bars */}
        <div
          ref={progressRef}
          className="flex items-end gap-[2px] h-[28px] cursor-pointer touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {waveformBars.map((height, i) => {
            const barProgress = i / waveformBars.length;
            const isActive = barProgress <= progress;
            return (
              <div
                key={i}
                className={`flex-1 rounded-full transition-colors duration-100 ${isActive ? barActiveColor : barInactiveColor}`}
                style={{
                  height: `${Math.max(12, height * 100)}%`,
                  minWidth: '2px',
                }}
              />
            );
          })}
        </div>

        {/* Time + Speed */}
        <div className="flex items-center justify-between mt-1">
          <span className={`text-[10px] font-mono ${timeColor}`}>
            {displayTime}
          </span>
          <button
            onClick={toggleSpeed}
            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md transition-colors ${speedBtnClass}`}
          >
            {speed}x
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceMessagePlayer;
