/* eslint-disable */

// src/pages/Tuner/TunerPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { 
  MicrophoneIcon, 
  StopIcon, 
  ExclamationTriangleIcon,
  MusicalNoteIcon,
  SignalIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/solid';

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const NOTE_FREQUENCIES: { [key: string]: number } = {
  'C': 261.63, 'C#': 277.18, 'Db': 277.18, 'D': 293.66, 'D#': 311.13, 'Eb': 311.13,
  'E': 329.63, 'F': 349.23, 'F#': 369.99, 'Gb': 369.99, 'G': 392.00, 'G#': 415.30,
  'Ab': 415.30, 'A': 440.00, 'A#': 466.16, 'Bb': 466.16, 'B': 493.88
};

const TunerPage: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [pitch, setPitch] = useState<number | null>(null);
  const [note, setNote] = useState<string>("--");
  const [cents, setCents] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [selectedInstrument, setSelectedInstrument] = useState<'Guitar' | 'Bass' | 'Ukulele' | 'Violin' | 'Chromatic'>('Chromatic');
  const [closestNote, setClosestNote] = useState<string>("--");
  const [ ] = useState<number>(440);

  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const requestRef = useRef<number | null>(null);
  // const bufferRef = useRef<Float32Array>(new Float32Array(2048));
  
  // Visual Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const displayCentsRef = useRef(0);

  // Instrument-specific tuning references
  const TUNING_REFERENCES = {
    Guitar: { A4: 440, name: 'E-A-D-G-B-E', strings: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'] },
    Bass: { A4: 440, name: 'E-A-D-G', strings: ['E1', 'A1', 'D2', 'G2'] },
    Ukulele: { A4: 440, name: 'G-C-E-A', strings: ['G4', 'C4', 'E4', 'A4'] },
    Violin: { A4: 440, name: 'G-D-A-E', strings: ['G3', 'D4', 'A4', 'E5'] },
    Chromatic: { A4: 440, name: 'All Notes', strings: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] }
  };

  // Find closest note and calculate cents
  const findClosestNote = (frequency: number): { note: string; cents: number } => {
    let minDiff = Infinity;
    let closestNote = "C";
    let targetFreq = 440;
    
    for (const [note, noteFreq] of Object.entries(NOTE_FREQUENCIES)) {
      // Check multiple octaves
      for (let octave = -2; octave <= 2; octave++) {
        const freq = noteFreq * Math.pow(2, octave);
        const diff = Math.abs(frequency - freq);
        
        if (diff < minDiff) {
          minDiff = diff;
          closestNote = note;
          targetFreq = freq;
        }
      }
    }
    
    // const [targetFrequency, setTargetFrequency] = useState<number>(440);

    
    // Calculate cents difference
    const cents = 1200 * Math.log2(frequency / targetFreq);
    return { note: closestNote, cents: Math.round(cents * 10) / 10 };
  };

  // --- ALGORITHM (Auto-Correlate) ---
  const autoCorrelate = (buf: Float32Array, sampleRate: number) => {
    let size = buf.length;
    let rms = 0;
    for (let i = 0; i < size; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / size);

    if (rms < 0.01) return -1;

    let r1 = 0, r2 = size - 1; const thres = 0.2;
    for (let i = 0; i < size / 2; i++) { if (Math.abs(buf[i]) < thres) { r1 = i; break; } }
    for (let i = 1; i < size / 2; i++) { if (Math.abs(buf[size - i]) < thres) { r2 = size - i; break; } }

    const newBuf = buf.slice(r1, r2);
    size = newBuf.length;
    
    const c = new Array(size).fill(0);
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size - i; j++) c[i] = c[i] + newBuf[j] * newBuf[j + i];
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < size; i++) {
      if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
    }
    
    let T0 = maxpos;
    const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);

    return sampleRate / T0;
  };

  // --- UPDATE LOOP ---
  const update = () => {
    if (!analyserRef.current || !audioContextRef.current) return;

    const bufferRef = useRef<Float32Array>(new Float32Array(2048));
    const ac = autoCorrelate(bufferRef.current, audioContextRef.current.sampleRate);
    
    if (ac !== -1) {
      setPitch(ac);
      
      // Chromatic tuning - find closest note
      const { note: closest, cents: calculatedCents } = findClosestNote(ac);
      setClosestNote(closest);
      setNote(closest);
      
      // Smooth interpolation for the needle
      displayCentsRef.current += (calculatedCents - displayCentsRef.current) * 0.15;
      setCents(displayCentsRef.current);
    } else {
      // Decay needle to center if no sound
      displayCentsRef.current *= 0.95;
      setCents(displayCentsRef.current);
      if (Math.abs(displayCentsRef.current) < 1) {
        setPitch(null);
        setClosestNote("--");
      }
    }

    // COMPACT Oscilloscope Visualization
    if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            const width = canvas.width;
            const height = canvas.height;
            
            // Clear with dark background
            ctx.fillStyle = 'rgba(0, 5, 0, 0.3)';
            ctx.fillRect(0, 0, width, height);
            
            // Simplified grid - fewer lines
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.08)';
            ctx.lineWidth = 0.5;
            for(let x=0; x<width; x+=30) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
            for(let y=0; y<height; y+=15) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
            ctx.stroke();

            // Waveform with reduced amplification
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = ac !== -1 ? '#4ade80' : '#15803d';
            ctx.shadowBlur = 3;
            ctx.shadowColor = '#4ade80';
            
            ctx.beginPath();
            const sliceWidth = width * 1.0 / bufferRef.current.length;
            let x = 0;
            const step = 12; // Increased step for performance

            for (let i = 0; i < bufferRef.current.length; i+=step) {
                const v = bufferRef.current[i] * 25; // Reduced amplification
                const y = (height / 2) + v;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                x += sliceWidth * step;
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }

    requestRef.current = requestAnimationFrame(update);
  };

  const startTuner = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      });
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;
      
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      setIsListening(true);
      update();
    } catch (err) {
      console.error(err);
      setError("Microphone access denied. Please allow microphone permissions.");
      setIsListening(false);
    }
  };

  const stopTuner = () => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (sourceRef.current) sourceRef.current.disconnect();
    if (audioContextRef.current) audioContextRef.current.close();
    
    setIsListening(false);
    setPitch(null);
    setNote("--");
    setClosestNote("--");
    setCents(0);
    displayCentsRef.current = 0;
  };

  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (audioContextRef.current?.state !== 'closed') {
         audioContextRef.current?.close();
      }
    };
  }, []);

  // --- GAUGE MATH ---
  const rotation = Math.max(-50, Math.min(50, cents)) * (90 / 50);
  const isInTune = Math.abs(cents) < 3 && pitch !== null;
  const isCloseToTune = Math.abs(cents) < 10 && pitch !== null;
  const isListeningActive = isListening;

  // Dynamic Backlight Color Calculation
  const backlightHue = Math.max(0, 120 - (Math.abs(cents) * 2.4)); 
  const backlightColor = isListeningActive 
    ? (pitch ? `hsla(${backlightHue}, 100%, 50%, 0.4)` : 'rgba(245, 158, 11, 0.2)')
    : 'rgba(0,0,0,0.2)';

  return (
    <div className=" w-screen bg-stone-900 flex flex-col overflow-hidden">
      
      {/* COMPACT HEADER */}
      <header className="flex-none px-4 py-2 flex items-center justify-between bg-stone-800/50 backdrop-blur-sm border-b border-stone-700/50">
        <div className="flex items-center gap-2">
          <div className="bg-green-500/20 p-1 rounded">
            <MusicalNoteIcon className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Chromatic Tuner</h1>
            <p className="text-[10px] text-stone-400">Professional Tuning</p>
          </div>
        </div>

        {/* A4 = 440Hz Tuning Pointer */}
        <div className="flex items-center gap-2 bg-stone-700/50 px-2 py-1 rounded border border-stone-600/50">
          <div className="text-amber-300 text-[10px] font-mono font-bold">A4 = 440Hz</div>
        </div>

        {/* Compact Instrument Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-stone-400">Mode:</span>
          <select 
            value={selectedInstrument}
            onChange={(e) => setSelectedInstrument(e.target.value as any)}
            className="bg-stone-700 border border-stone-600 rounded px-2 py-1 text-xs text-white focus:ring-1 focus:ring-green-500"
            disabled={isListening}
          >
            <option value="Chromatic">Chromatic</option>
            <option value="Guitar">Guitar</option>
            <option value="Bass">Bass</option>
            <option value="Ukulele">Ukulele</option>
            <option value="Violin">Violin</option>
          </select>
        </div>
      </header>

      {/* SCROLLABLE MAIN CONTENT - Optimized for mobile */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="max-w-4xl mx-auto space-y-3">
          {error && (
            <div className="p-2 bg-red-900/80 text-red-100 rounded border border-red-700 flex items-center gap-2 text-xs">
              <ExclamationTriangleIcon className="w-3 h-3 shrink-0" />
              {error}
            </div>
          )}

          {/* Compact Instrument Info */}
          <div className="bg-stone-800/50 rounded-lg p-3 border border-stone-700/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white">
                  {selectedInstrument === 'Chromatic' ? 'Chromatic Tuner' : `${selectedInstrument} Tuner`}
                </h2>
                <p className="text-stone-400 text-[10px]">
                  {selectedInstrument === 'Chromatic' 
                    ? 'All Notes • A4 = 440 Hz' 
                    : `Tuning: ${TUNING_REFERENCES[selectedInstrument].name}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-stone-400 text-[10px]">Target</p>
                <p className="text-sm font-bold text-green-400">{closestNote}</p>
              </div>
            </div>
          </div>

          {/* COMPACT VINTAGE RADIO UNIT - Reduced height */}
          <div className="bg-linear-to-b from-stone-300 to-stone-400 rounded-xl p-1 shadow-[0_10px_30px_rgba(0,0,0,0.7)] border-t border-stone-200/50">
            {/* Inner Bezel */}
            <div className="bg-stone-800 rounded-lg p-3 border-2 border-stone-700 relative overflow-hidden">
              
              {/* Wood Grain Overlay Effect */}
              <div className="absolute inset-0 opacity-10 pointer-events-none" 
                   style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)', backgroundSize: '8px 8px' }}>
              </div>

              {/* COMPACT ANALOG METER WINDOW - Reduced height */}
              <div className="relative w-full h-40 bg-black rounded-t-[3rem] rounded-b-md overflow-hidden border-2 border-stone-600 shadow-[inset_0_0_10px_rgba(0,0,0,1)] mb-3">
                
                {/* Dynamic Backlight Layer */}
                <div className="absolute inset-0 transition-colors duration-200 ease-linear"
                     style={{ backgroundColor: backlightColor, boxShadow: `inset 0 0 40px ${backlightColor}` }}>
                </div>

                {/* Vignette */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,transparent_30%,black_90%)]"></div>
                
                {/* Glass Reflection */}
                <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/3 to-white/5 pointer-events-none rounded-t-[3rem]"></div>

                {/* Scale Graphics */}
                <svg viewBox="0 0 300 140" className="absolute inset-0 w-full h-full">
                  <path d="M 40 130 A 100 100 0 0 1 260 130" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                  
                  {/* Ticks */}
                  {Array.from({ length: 21 }).map((_, i) => {
                    const val = i - 10;
                    const deg = (val * (180 / 20)) - 90;
                    const rad = (deg * Math.PI) / 180;
                    const cx = 150; const cy = 130; const r = 100;
                    const isMajor = i % 5 === 0;
                    const isCenter = i === 10;
                    
                    const x1 = cx + r * Math.sin(rad);
                    const y1 = cy - r * Math.cos(rad);
                    const len = isCenter ? 10 : (isMajor ? 6 : 3);
                    const x2 = cx + (r - len) * Math.sin(rad);
                    const y2 = cy - (r - len) * Math.cos(rad);

                    return (
                      <line 
                        key={i} x1={x1} y1={y1} x2={x2} y2={y2} 
                        stroke={isCenter ? '#fbbf24' : 'rgba(255,255,255,0.3)'} 
                        strokeWidth={isCenter ? 2 : 1}
                      />
                    );
                  })}

                  {/* Zone Indicators */}
                  <path d="M 110 130 A 100 100 0 0 1 150 40" fill="none" stroke="rgba(239, 68, 68, 0.3)" strokeWidth="6" strokeLinecap="round" />
                  <path d="M 150 40 A 100 100 0 0 1 190 130" fill="none" stroke="rgba(239, 68, 68, 0.3)" strokeWidth="6" strokeLinecap="round" />
                  <path d="M 125 130 A 100 100 0 0 1 150 80" fill="none" stroke="rgba(234, 179, 8, 0.4)" strokeWidth="6" strokeLinecap="round" />
                  <path d="M 150 80 A 100 100 0 0 1 175 130" fill="none" stroke="rgba(234, 179, 8, 0.4)" strokeWidth="6" strokeLinecap="round" />
                  <path d="M 140 130 A 100 100 0 0 1 150 110" fill="none" stroke="rgba(34, 197, 94, 0.5)" strokeWidth="6" strokeLinecap="round" />
                  <path d="M 150 110 A 100 100 0 0 1 160 130" fill="none" stroke="rgba(34, 197, 94, 0.5)" strokeWidth="6" strokeLinecap="round" />

                  <text x="150" y="115" textAnchor="middle" className="fill-amber-400 text-[5px] font-mono tracking-widest opacity-80">TUNING</text>
                  <text x="50" y="125" textAnchor="middle" className="fill-white/30 text-[5px] font-bold">FLAT</text>
                  <text x="250" y="125" textAnchor="middle" className="fill-white/30 text-[5px] font-bold">SHARP</text>
                  
                  {/* Cent Markers */}
                  <text x="80" y="130" textAnchor="middle" className="fill-white/40 text-[4px] font-mono">-50</text>
                  <text x="110" y="130" textAnchor="middle" className="fill-white/40 text-[4px] font-mono">-25</text>
                  <text x="150" y="130" textAnchor="middle" className="fill-amber-300 text-[4px] font-mono">0</text>
                  <text x="190" y="130" textAnchor="middle" className="fill-white/40 text-[4px] font-mono">+25</text>
                  <text x="220" y="130" textAnchor="middle" className="fill-white/40 text-[4px] font-mono">+50</text>
                </svg>

                {/* PERFECT TUNING ZONE INDICATOR */}
                <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 w-10 h-0.5 bg-green-400/60 rounded-full z-10 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>

                {/* NOTE DISPLAY (Digital Overlay) */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-20">
                  <div className={`text-2xl font-black tracking-tighter drop-shadow-lg transition-all duration-300 ${isInTune ? 'text-white scale-110' : 'text-white/80'}`}>
                    {note}
                  </div>
                  <div className="text-[9px] font-mono text-amber-300/80 mt-0.5">
                    {pitch ? `${pitch.toFixed(1)} Hz` : '-- Hz'}
                    {pitch && <span className="text-green-400 ml-1">({Math.abs(cents).toFixed(1)}¢)</span>}
                  </div>
                  
                  {/* TUNING STATUS WITH VISUAL FEEDBACK */}
                  <div className={`mt-1 transition-all duration-300 ${
                    isInTune ? 'scale-105' : 'scale-100'
                  }`}>
                    {isInTune && (
                      <div className="flex items-center justify-center gap-1 animate-pulse">
                        <CheckBadgeIcon className="w-3 h-3 text-green-400" />
                        <span className="text-xs font-bold text-green-400">PERFECT!</span>
                      </div>
                    )}
                    {!isInTune && pitch && (
                      <div className={`text-xs font-bold ${
                        isCloseToTune ? 'text-yellow-400' : 'text-amber-400'
                      }`}>
                        {cents > 0 ? 'SHARP' : 'FLAT'} • {Math.abs(cents).toFixed(1)}¢
                      </div>
                    )}
                  </div>
                </div>

                {/* CAR-STYLE GAUGE POINTER/NEEDLE */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-30" style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}>
                  {/* Needle Base */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-linear-to-br from-stone-700 to-stone-900 rounded-full border border-stone-600 shadow-md z-40"></div>
                  
                  {/* The Needle stick - Car Gauge Style */}
                  <div className="absolute bottom-1.5 left-1/2 w-1 h-20 bg-linear-to-t from-red-500 via-red-400 to-red-300 shadow-[0_0_8px_rgba(239,68,68,0.8)] origin-bottom -translate-x-1/2"></div>
                  
                  {/* Pointer Head - Arrow Style */}
                  <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
                    <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-b-10 border-l-transparent border-r-transparent border-b-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]"></div>
                  </div>

                  {/* Center Cap */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-5 h-5 bg-linear-to-br from-stone-300 to-stone-500 rounded-full border border-stone-400 shadow-inner z-50 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-stone-700 rounded-full shadow-md"></div>
                  </div>
                </div>

                {/* CENTER TUNING INDICATOR */}
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex items-center gap-1 z-20">
                  <div className={`w-1 h-1 rounded-full transition-all duration-300 ${
                    isInTune ? 'bg-green-400 animate-pulse scale-125' : 'bg-gray-500'
                  }`}></div>
                  <span className="text-[7px] text-gray-400 font-mono">IN TUNE</span>
                  <div className={`w-1 h-1 rounded-full transition-all duration-300 ${
                    isInTune ? 'bg-green-400 animate-pulse scale-125' : 'bg-gray-500'
                  }`}></div>
                </div>
              </div>

              {/* COMPACT CONTROLS & OSCILLOSCOPE */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 items-center ">
                {/* Toggle Switch Area */}
                <div className="col-span-1 flex flex-col items-center">
                  <button 
                    onClick={isListening ? stopTuner : startTuner}
                    className={`animate-pulse w-10 h-10 rounded-full border-2 shadow-md flex items-center justify-center transition-all active:scale-95 ${
                      isListening 
                      ? 'bg-stone-800 border-green-500/50 text-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]' 
                      : 'bg-stone-300 border-stone-400 text-stone-500'
                    }`}
                  >
                    {isListening ? (
                      <StopIcon className="w-3 h-3" />
                    ) : (
                      <MicrophoneIcon className="w-3 h-3" />
                    )}
                  </button>
                  <span className="text-[7px] font-bold text-white uppercase mt-1 tracking-widest">
                    {isListening ? 'ON' : 'START'}
                  </span>
                </div>

                {/* COMPACT Oscilloscope Screen */}
                <div className="col-span-2 bg-black rounded border border-stone-600 overflow-hidden h-10 relative shadow-inner">
                  <canvas ref={canvasRef} width={200} height={40} className="w-full h-full opacity-80" />
                  <div className="absolute top-0.5 right-0.5 text-[4px] text-green-500/50 font-mono">SIG</div>
                  <div className="absolute bottom-0.5 left-0.5 text-[4px] text-stone-500 font-mono">
                    {isListening ? 'ANALYZING' : 'READY'}
                  </div>
                </div>
              </div>

              {/* Compact Status Indicators */}
              <div className="mt-2 flex justify-center gap-2">
                <div className="flex items-center gap-0.5">
                  <div className={`w-1 h-1 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-stone-600'}`}></div>
                  <span className="text-[7px] text-stone-400">MIC</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <div className={`w-1 h-1 rounded-full ${pitch ? 'bg-blue-500' : 'bg-stone-600'}`}></div>
                  <span className="text-[7px] text-stone-400">SIGNAL</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <div className={`w-1 h-1 rounded-full ${isInTune ? 'bg-green-500 animate-pulse' : 'bg-stone-600'}`}></div>
                  <span className="text-[7px] text-stone-400">TUNED</span>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Additional Sections - Now properly visible */}
          <div className="space-y-2">
            {/* Tuning Tips */}
            <div className="bg-stone-800/50 rounded-lg p-2 border border-stone-700/50 backdrop-blur-sm">
              <h3 className="text-xs font-bold text-white mb-1 flex items-center gap-1">
                <SignalIcon className="w-3 h-3 text-green-400" />
                Tuning Guide
              </h3>
              <div className="grid grid-cols-2 gap-1 text-[10px] text-stone-300">
                <div className="space-y-0.5">
                  <p>• Play any note clearly</p>
                  <p>• Needle left = Flat</p>
                  <p>• Red zone = Very out of tune</p>
                </div>
                <div className="space-y-0.5">
                  <p>• Green = Perfect tune</p>
                  <p>• Needle right = Sharp</p>
                  <p>• Yellow zone = Close to tune</p>
                </div>
              </div>
            </div>

            {/* Note Reference - Chromatic Scale */}
            <div className="bg-stone-800/50 rounded-lg p-2 border border-stone-700/50 backdrop-blur-sm">
              <h3 className="text-xs font-bold text-white mb-1">Chromatic Scale Reference</h3>
              <div className="grid grid-cols-6 gap-1">
                {NOTES.map((note) => (
                  <div key={note} className={`text-center p-1 rounded text-[9px] font-mono ${
                    note === closestNote && pitch 
                      ? 'bg-green-500/30 text-green-400 border border-green-500/50' 
                      : 'bg-stone-700/30 text-stone-400 border border-stone-600'
                  }`}>
                    {note}
                  </div>
                ))}
              </div>
            </div>

            {/* Current Tuning Info */}
            <div className="bg-stone-800/50 rounded-lg p-2 border border-stone-700/50 backdrop-blur-sm">
              <h3 className="text-xs font-bold text-white mb-1">Current Tuning</h3>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-stone-400">Detected:</span>
                    <span className="text-white font-mono">{note}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Frequency:</span>
                    <span className="text-white font-mono">{pitch ? `${pitch.toFixed(1)} Hz` : '-- Hz'}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-stone-400">Cents:</span>
                    <span className={`font-mono ${isInTune ? 'text-green-400' : isCloseToTune ? 'text-yellow-400' : 'text-red-400'}`}>
                      {pitch ? `${cents > 0 ? '+' : ''}${cents.toFixed(1)}¢` : '--¢'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Status:</span>
                    <span className={`font-bold ${isInTune ? 'text-green-400' : isCloseToTune ? 'text-yellow-400' : 'text-red-400'}`}>
                      {isInTune ? 'IN TUNE' : pitch ? 'ADJUSTING' : 'NO SIGNAL'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TunerPage;