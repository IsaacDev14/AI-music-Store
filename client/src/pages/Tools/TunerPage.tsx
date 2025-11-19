// src/pages/Tuner/TunerPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { 
  MicrophoneIcon, 
  StopIcon, 
  ExclamationTriangleIcon,
  MusicalNoteIcon,
  SignalIcon
} from '@heroicons/react/24/solid';

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const TunerPage: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [pitch, setPitch] = useState<number | null>(null);
  const [note, setNote] = useState<string>("--");
  const [cents, setCents] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [selectedInstrument, setSelectedInstrument] = useState<'Guitar' | 'Bass' | 'Ukulele' | 'Violin'>('Guitar');

  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const requestRef = useRef<number | null>(null);
  const bufferRef = useRef<Float32Array>(new Float32Array(2048));
  
  // Visual Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const displayCentsRef = useRef(0);

  // Instrument-specific tuning references
  const TUNING_REFERENCES = {
    Guitar: { A4: 440, name: 'E-A-D-G-B-E' },
    Bass: { A4: 440, name: 'E-A-D-G' },
    Ukulele: { A4: 440, name: 'G-C-E-A' },
    Violin: { A4: 440, name: 'G-D-A-E' }
  };

  // --- ALGORITHM (Auto-Correlate) ---
  const autoCorrelate = (buf: Float32Array, sampleRate: number) => {
    let size = buf.length;
    let rms = 0;
    for (let i = 0; i < size; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / size);

    if (rms < 0.01) return -1;

    let r1 = 0, r2 = size - 1, thres = 0.2;
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

    analyserRef.current.getFloatTimeDomainData(bufferRef.current);
    const ac = autoCorrelate(bufferRef.current, audioContextRef.current.sampleRate);
    
    if (ac !== -1) {
      const noteNum = 12 * (Math.log(ac / 440) / Math.log(2));
      const noteIndex = (Math.round(noteNum) + 69) % 12;
      const targetCents = Math.floor((noteNum - Math.round(noteNum)) * 100);
      
      setPitch(ac);
      setNote(NOTES[noteIndex]);
      displayCentsRef.current += (targetCents - displayCentsRef.current) * 0.15;
      setCents(displayCentsRef.current);
    } else {
       displayCentsRef.current *= 0.95;
       setCents(displayCentsRef.current);
       if (Math.abs(displayCentsRef.current) < 1) {
           setPitch(null); 
       }
    }

    // Oscilloscope Visualization
    if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            const width = canvas.width;
            const height = canvas.height;
            
            ctx.fillStyle = 'rgba(0, 10, 0, 0.2)';
            ctx.fillRect(0, 0, width, height);
            
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.1)';
            ctx.lineWidth = 1;
            for(let x=0; x<width; x+=20) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
            for(let y=0; y<height; y+=20) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
            ctx.stroke();

            ctx.lineWidth = 2;
            ctx.strokeStyle = ac !== -1 ? '#4ade80' : '#15803d';
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#4ade80';
            
            ctx.beginPath();
            const sliceWidth = width * 1.0 / bufferRef.current.length;
            let x = 0;
            const step = 8; 

            for (let i = 0; i < bufferRef.current.length; i+=step) {
                const v = bufferRef.current[i] * 40;
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
  const isListeningActive = isListening;

  // Dynamic Backlight Color Calculation
  const backlightHue = Math.max(0, 120 - (Math.abs(cents) * 2.4)); 
  const backlightColor = isListeningActive 
    ? (pitch ? `hsla(${backlightHue}, 100%, 50%, 0.4)` : 'rgba(245, 158, 11, 0.2)')
    : 'rgba(0,0,0,0.2)';

  return (
    <div className="h-screen w-screen bg-stone-900 flex flex-col overflow-hidden">
      
      {/* COMPACT HEADER */}
      <header className="flex-none px-6 py-3 flex items-center justify-between bg-stone-800/50 backdrop-blur-sm border-b border-stone-700/50">
        <div className="flex items-center gap-3">
          <div className="bg-green-500/20 p-2 rounded-lg">
            <MusicalNoteIcon className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Precision Tuner</h1>
            <p className="text-xs text-stone-400">Professional Instrument Tuning</p>
          </div>
        </div>

        {/* Compact Instrument Selector */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-stone-400">Instrument:</span>
          <select 
            value={selectedInstrument}
            onChange={(e) => setSelectedInstrument(e.target.value as any)}
            className="bg-stone-700 border border-stone-600 rounded-lg px-3 py-1 text-sm text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
            disabled={isListening}
          >
            <option value="Guitar">Guitar</option>
            <option value="Bass">Bass</option>
            <option value="Ukulele">Ukulele</option>
            <option value="Violin">Violin</option>
          </select>
        </div>
      </header>

      {/* MAIN CONTENT - Fills remaining space */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="h-full max-w-6xl mx-auto flex flex-col">
          {error && (
            <div className="mb-4 p-3 bg-red-900/80 text-red-100 text-sm rounded-lg border border-red-700 flex items-center gap-3">
              <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Compact Instrument Info */}
          <div className="mb-4 bg-stone-800/50 rounded-xl p-4 border border-stone-700/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">{selectedInstrument} Tuner</h2>
                <p className="text-stone-400 text-xs">
                  Tuning: <span className="font-mono text-amber-400">{TUNING_REFERENCES[selectedInstrument].name}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-stone-400 text-xs">Reference</p>
                <p className="text-lg font-bold text-green-400">A4 = 440 Hz</p>
              </div>
            </div>
          </div>

          {/* VINTAGE RADIO UNIT - Flexible height */}
          <div className="flex-1 min-h-0 mb-4">
            <div className="bg-gradient-to-b from-stone-300 to-stone-400 rounded-2xl p-2 shadow-[0_20px_60px_rgba(0,0,0,0.7)] border-t border-stone-200/50 h-full">
              {/* Inner Bezel */}
              <div className="bg-stone-800 rounded-xl p-6 border-4 border-stone-700 relative overflow-hidden h-full flex flex-col">
                
                {/* Wood Grain Overlay Effect */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" 
                     style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }}>
                </div>

                {/* ANALOG METER WINDOW - Flexible */}
                <div className="relative flex-1 min-h-0 bg-black rounded-t-[4rem] rounded-b-lg overflow-hidden border-4 border-stone-600 shadow-[inset_0_0_20px_rgba(0,0,0,1)] mb-4">
                  
                  {/* Dynamic Backlight Layer */}
                  <div className="absolute inset-0 transition-colors duration-200 ease-linear"
                       style={{ backgroundColor: backlightColor, boxShadow: `inset 0 0 60px ${backlightColor}` }}>
                  </div>

                  {/* Vignette */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,transparent_30%,black_90%)]"></div>
                  
                  {/* Glass Reflection */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none rounded-t-[4rem]"></div>

                  {/* Scale Graphics */}
                  <svg viewBox="0 0 300 160" className="absolute inset-0 w-full h-full">
                    <path d="M 40 150 A 110 110 0 0 1 260 150" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                    
                    {/* Ticks */}
                    {Array.from({ length: 21 }).map((_, i) => {
                      const val = i - 10;
                      const deg = (val * (180 / 20)) - 90;
                      const rad = (deg * Math.PI) / 180;
                      const cx = 150; const cy = 150; const r = 110;
                      const isMajor = i % 5 === 0;
                      const isCenter = i === 10;
                      
                      const x1 = cx + r * Math.sin(rad);
                      const y1 = cy - r * Math.cos(rad);
                      const len = isCenter ? 15 : (isMajor ? 10 : 5);
                      const x2 = cx + (r - len) * Math.sin(rad);
                      const y2 = cy - (r - len) * Math.cos(rad);

                      return (
                        <line 
                          key={i} x1={x1} y1={y1} x2={x2} y2={y2} 
                          stroke={isCenter ? '#fbbf24' : 'rgba(255,255,255,0.4)'} 
                          strokeWidth={isCenter ? 3 : 1.5}
                        />
                      );
                    })}
                    <text x="150" y="130" textAnchor="middle" className="fill-amber-400 text-[8px] font-mono tracking-widest opacity-80">TUNING</text>
                    <text x="50" y="140" textAnchor="middle" className="fill-white/40 text-[8px] font-bold">FLAT</text>
                    <text x="250" y="140" textAnchor="middle" className="fill-white/40 text-[8px] font-bold">SHARP</text>
                  </svg>

                  {/* NOTE DISPLAY (Digital Overlay) */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-20">
                    <div className={`text-5xl font-black tracking-tighter drop-shadow-lg transition-all duration-300 ${isInTune ? 'text-white scale-110' : 'text-white/80'}`}>
                      {note}
                    </div>
                    <div className="text-xs font-mono text-amber-300/80 mt-1">
                      {pitch ? `${pitch.toFixed(1)} Hz` : '-- Hz'}
                    </div>
                    <div className={`text-sm font-bold mt-2 transition-all ${isInTune ? 'text-green-400 scale-105' : 'text-amber-400'}`}>
                      {isInTune ? 'PERFECT!' : Math.abs(cents) > 20 ? 'ADJUST TUNING' : 'GETTING CLOSE'}
                    </div>
                  </div>

                  {/* NEEDLE */}
                  <div className="absolute bottom-0 left-1/2 w-0 h-0 z-30" style={{ transform: `rotate(${rotation}deg)` }}>
                    {/* The Needle stick */}
                    <div className="absolute bottom-0 -left-[1px] w-[2px] h-[60%] bg-red-500 shadow-[0_0_5px_rgba(255,0,0,0.8)] origin-bottom"></div>
                  </div>
                  
                  {/* Pivot Cap */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-12 h-12 bg-gradient-to-b from-stone-700 to-stone-900 rounded-full border-4 border-stone-600 shadow-lg z-40 flex items-center justify-center">
                    <div className="w-3 h-3 bg-stone-500 rounded-full shadow-inner"></div>
                  </div>
                </div>

                {/* CONTROLS & OSCILLOSCOPE - Compact */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
                  {/* Toggle Switch Area */}
                  <div className="col-span-1 flex flex-col items-center">
                    <button 
                      onClick={isListening ? stopTuner : startTuner}
                      className={`w-16 h-16 rounded-full border-4 shadow-lg flex items-center justify-center transition-all active:scale-95 ${
                        isListening 
                        ? 'bg-stone-800 border-green-500/50 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]' 
                        : 'bg-stone-300 border-stone-400 text-stone-500'
                      }`}
                    >
                      {isListening ? (
                        <StopIcon className="w-6 h-6" />
                      ) : (
                        <MicrophoneIcon className="w-6 h-6" />
                      )}
                    </button>
                    <span className="text-[10px] font-bold text-stone-500 uppercase mt-1 tracking-widest">
                      {isListening ? 'LISTENING' : 'START'}
                    </span>
                  </div>

                  {/* Oscilloscope Screen */}
                  <div className="col-span-2 bg-black rounded-lg border-2 border-stone-600 overflow-hidden h-20 relative shadow-inner">
                    <canvas ref={canvasRef} width={300} height={80} className="w-full h-full opacity-80" />
                    <div className="absolute top-1 right-1 text-[6px] text-green-500/50 font-mono">SIGNAL</div>
                    <div className="absolute bottom-1 left-1 text-[6px] text-stone-500 font-mono">
                      {isListening ? 'ANALYZING...' : 'READY'}
                    </div>
                  </div>
                </div>

                {/* Status Indicators - Compact */}
                <div className="mt-4 flex justify-center gap-4">
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-stone-600'}`}></div>
                    <span className="text-[10px] text-stone-400">MIC</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${pitch ? 'bg-blue-500' : 'bg-stone-600'}`}></div>
                    <span className="text-[10px] text-stone-400">SIGNAL</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${isInTune ? 'bg-green-500' : 'bg-stone-600'}`}></div>
                    <span className="text-[10px] text-stone-400">TUNED</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Tuning Tips */}
          <div className="bg-stone-800/50 rounded-xl p-4 border border-stone-700/50 backdrop-blur-sm">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <SignalIcon className="w-4 h-4 text-green-400" />
              Tuning Tips
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-stone-300">
              <div className="space-y-1">
                <p>• Play one string at a time</p>
                <p>• Ensure good microphone placement</p>
              </div>
              <div className="space-y-1">
                <p>• Green = Perfectly in tune</p>
                <p>• Needle shows flat/sharp</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TunerPage;