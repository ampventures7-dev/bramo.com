"use client";

import { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX, Waves } from "lucide-react";

export function CoastalAudioToggle() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Synthesize realistic Konkan coastal ocean waves using Web Audio API
  const startOceanAudio = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      // Create brown noise buffer for realistic ocean rumble
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Low pass filter for deep muffled sea waves
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(320, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNodeRef.current = gain;

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      whiteNoise.start();

      // Gentle wave rhythm modulation (ebbing & flowing surf)
      let phase = 0;
      intervalRef.current = setInterval(() => {
        if (!audioContextRef.current || !gainNodeRef.current) return;
        phase += 0.08;
        const targetGain = 0.04 + 0.06 * (Math.sin(phase) * 0.5 + 0.5);
        gainNodeRef.current.gain.linearRampToValueAtTime(
          targetGain,
          audioContextRef.current.currentTime + 0.5
        );
      }, 500);

      setIsPlaying(true);
    } catch {
      // Audio context restricted or unsupported
      setIsPlaying(false);
    }
  };

  const stopOceanAudio = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsPlaying(false);
  };

  const toggleSound = () => {
    if (isPlaying) {
      stopOceanAudio();
    } else {
      startOceanAudio();
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  return (
    <button
      type="button"
      onClick={toggleSound}
      className={`fixed bottom-6 right-6 z-40 px-3.5 py-2.5 rounded-full shadow-2xl backdrop-blur-xl border transition-all duration-300 flex items-center gap-2 text-xs font-bold group hover:scale-105 active:scale-95 ${
        isPlaying
          ? "bg-konkan-teal-800/90 text-white border-konkan-teal-500 shadow-konkan-teal-900/30"
          : "bg-white/85 text-slate-800 border-white/60 hover:bg-white shadow-slate-900/10"
      }`}
      title={isPlaying ? "Mute Konkan Ocean Surf" : "Play Konkan Ocean Waves Ambient Sound"}
      aria-label="Coastal Ocean Sound Toggle"
    >
      <div className="relative">
        {isPlaying ? (
          <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
        ) : (
          <VolumeX className="w-4 h-4 text-slate-500 group-hover:text-konkan-teal-700" />
        )}
      </div>

      <span className="hidden sm:inline">
        {isPlaying ? "Konkan Waves Live" : "Ocean Breeze"}
      </span>

      {isPlaying && (
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
      )}
    </button>
  );
}
