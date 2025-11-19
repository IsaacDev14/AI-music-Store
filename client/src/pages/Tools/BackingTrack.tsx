import React, { useState, useEffect, useRef } from 'react';
import { generateBandArrangement } from '../../api/apiService';
import type { BackingTrackResult } from '../../api/apiService';

import { 
  PlayIcon, 
  SparklesIcon, 
  SpeakerWaveIcon, 
  ArrowDownTrayIcon, 
  ArrowTopRightOnSquareIcon,
  AdjustmentsHorizontalIcon,
  MusicalNoteIcon,
  StopIcon,
  SwatchIcon,
  CursorArrowRaysIcon
} from '@heroicons/react/24/solid';

// --- CONSTANTS ---
const GENRES = ['Rock', 'Jazz', 'Funk', 'Lo-Fi', 'Hip Hop', 'Electronic', 'Blues', 'R&B', 'Pop'];
const KEYS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const MOODS = ['Energetic', 'Chill', 'Dark', 'Happy', 'Groovy', 'Melancholic', 'Dreamy'];

// --- AUDIO HELPERS ---
const NOTES_FREQ: Record<string, number> = {
  'C': 16.35, 'C#': 17.32, 'Db': 17.32, 'D': 18.35, 'D#': 19.45, 'Eb': 19.45, 'E': 20.60,
  'F': 21.83, 'F#': 23.12, 'Gb': 23.12, 'G': 24.50, 'G#': 25.96, 'Ab': 25.96, 'A': 27.50,
  'A#': 29.14, 'Bb': 29.14, 'B': 30.87
};

const getFreq = (noteStr: string) => {
  const match = noteStr.match(/^([A-G][#b]?)(-?\d+)$/);
  if (!match) return 440;
  const note = match[1];
  const octave = parseInt(match[2]);
  const base = NOTES_FREQ[note];
  if (!base) return 440;
  return base * Math.pow(2, octave);
};

const BackingTrack: React.FC = () => {
  // --- CONFIG STATE ---
  const [genre, setGenre] = useState('Lo-Fi');
  const [selectedKey, setSelectedKey] = useState('C');
  const [tempo, setTempo] = useState(90);
  const [mood, setMood] = useState('Chill');
  const [description, setDescription] = useState('');
  
  // --- APP STATE ---
  const [trackData, setTrackData] = useState<BackingTrackResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [volume, setVolume] = useState(0.5);

  // --- AUDIO REFS ---
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const currentStepRef = useRef(0);
  const timerIDRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);
  const destNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null); // For export

  // --- AUDIO ENGINE ---
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
      destNodeRef.current = audioCtxRef.current!.createMediaStreamDestination();
    }
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playSound = (instrument: string, notes: string[], durationSteps: number, time: number) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    
    // Master Gain for Volume
    const masterGain = ctx.createGain();
    masterGain.gain.value = volume;
    masterGain.connect(ctx.destination);
    if (destNodeRef.current) masterGain.connect(destNodeRef.current);

    if (instrument === 'drums') {
      notes.forEach(note => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(masterGain);

        if (note === 'kick') {
          osc.frequency.setValueAtTime(150, time);
          osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
          gain.gain.setValueAtTime(1, time);
          gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
          osc.start(time);
          osc.stop(time + 0.5);
        } else if (note === 'snare') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(100, time);
          gain.gain.setValueAtTime(0.7, time);
          gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
          osc.start(time);
          osc.stop(time + 0.2);
          
          // Noise burst for snare
          const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
          const data = noiseBuffer.getChannelData(0);
          for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
          const noise = ctx.createBufferSource();
          noise.buffer = noiseBuffer;
          const noiseGain = ctx.createGain();
          noiseGain.gain.setValueAtTime(0.5, time);
          noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
          noise.connect(noiseGain);
          noiseGain.connect(masterGain);
          noise.start(time);
        } else if (note.includes('hat')) {
           // Hi-hat synthesis
           const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
           const data = noiseBuffer.getChannelData(0);
           for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
           const noise = ctx.createBufferSource();
           noise.buffer = noiseBuffer;
           
           const filter = ctx.createBiquadFilter();
           filter.type = 'highpass';
           filter.frequency.value = 5000;

           const noiseGain = ctx.createGain();
           noiseGain.gain.setValueAtTime(0.3, time);
           noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

           noise.connect(filter);
           filter.connect(noiseGain);
           noiseGain.connect(masterGain);
           noise.start(time);
        }
      });
    } else {
      // Synths (Bass/Keys)
      const stepDuration = (60 / tempo) / 4;
      const duration = durationSteps * stepDuration;
      
      notes.forEach(note => {
        const freq = getFreq(note);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        if (instrument === 'bass') {
          osc.type = 'sawtooth';
          osc.frequency.value = freq;
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(600, time);
          filter.frequency.exponentialRampToValueAtTime(200, time + 0.2);
          gain.gain.setValueAtTime(0.8, time);
          gain.gain.setTargetAtTime(0, time + duration - 0.05, 0.1);
        } else {
          // Keys
          osc.type = 'triangle';
          osc.frequency.value = freq;
          filter.type = 'lowpass';
          filter.frequency.value = 2500;
          gain.gain.setValueAtTime(0, time);
          gain.gain.linearRampToValueAtTime(0.4, time + 0.05);
          gain.gain.setTargetAtTime(0, time + duration, 0.2);
        }
        
        osc.start(time);
        osc.stop(time + duration + 0.1);
      });
    }
  };

  const scheduleNote = (step: number, time: number) => {
    if (!trackData) return;

    // UI Sync
    const drawTime = (time - audioCtxRef.current!.currentTime) * 1000;
    setTimeout(() => {
      if (isPlayingRef.current) setCurrentStep(step);
    }, Math.max(0, drawTime));

    trackData.tracks.forEach(track => {
      const trackStep = track.steps.find(s => s.beat === step);
      if (trackStep && trackStep.notes.length > 0) {
        playSound(track.instrument, trackStep.notes, trackStep.duration || 1, time);
      }
    });
  };

  const nextStep = () => {
    const secondsPerBeat = 60.0 / tempo;
    nextNoteTimeRef.current += 0.25 * secondsPerBeat; // 16th note
    currentStepRef.current = (currentStepRef.current + 1) % 16;
  };

  const scheduler = () => {
    if (!audioCtxRef.current) return;
    const lookahead = 25.0;
    const scheduleAheadTime = 0.1;

    while (nextNoteTimeRef.current < audioCtxRef.current.currentTime + scheduleAheadTime) {
      scheduleNote(currentStepRef.current, nextNoteTimeRef.current);
      nextStep();
    }
    timerIDRef.current = window.setTimeout(scheduler, lookahead);
  };

  const handlePlay = () => {
    if (isPlaying) {
      // Stop
      setIsPlaying(false);
      isPlayingRef.current = false;
      if (timerIDRef.current) window.clearTimeout(timerIDRef.current);
      setCurrentStep(-1);
    } else {
      // Play
      if (!trackData) return;
      initAudio();
      setIsPlaying(true);
      isPlayingRef.current = true;
      currentStepRef.current = 0;
      nextNoteTimeRef.current = audioCtxRef.current!.currentTime + 0.05;
      scheduler();
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (timerIDRef.current) window.clearTimeout(timerIDRef.current);
    
    const prompt = `${genre} style, ${mood} mood, in key of ${selectedKey}, tempo ${tempo} BPM. ${description}`;
    const result = await generateBandArrangement(prompt);
    
    if (result) {
      setTrackData(result);
      if (result.bpm) setTempo(result.bpm);
    }
    setLoading(false);
  };

  const handleExport = () => {
    if (!trackData || !audioCtxRef.current || !destNodeRef.current) return;
    
    // Stop current playback
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (timerIDRef.current) window.clearTimeout(timerIDRef.current);

    // Setup recording
    const recorder = new MediaRecorder(destNodeRef.current.stream);
    const chunks: Blob[] = [];
    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backing-track-${genre}-${selectedKey}.wav`;
      a.click();
    };

    recorder.start();
    
    // Play 2 loops for recording
    isPlayingRef.current = true;
    currentStepRef.current = 0;
    nextNoteTimeRef.current = audioCtxRef.current.currentTime + 0.05;
    scheduler();

    // Stop after calculated time (2 bars * 4 beats * 60/bpm)
    const duration = (2 * 4 * 60) / tempo; 
    setTimeout(() => {
       isPlayingRef.current = false;
       if (timerIDRef.current) window.clearTimeout(timerIDRef.current);
       recorder.stop();
       setCurrentStep(-1);
    }, duration * 1000);
  };

  useEffect(() => {
    return () => {
      if (timerIDRef.current) window.clearTimeout(timerIDRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  const openYouTube = (query: string) => {
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query + " backing track")}`, '_blank');
  };

  return (
    <div className="w-screen flex flex-col bg-white overflow-hidden">
      {/* HEADER - Fixed */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-none shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
             <SparklesIcon className="w-6 h-6 text-indigo-500" />
             Backing Track Generator
          </h1>
          <p className="text-sm text-gray-500">Create custom play-along tracks instantly.</p>
        </div>
        <div className="flex items-center gap-4">
            {trackData && (
                <button 
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
                >
                    <ArrowDownTrayIcon className="w-4 h-4" /> Export WAV
                </button>
            )}
        </div>
      </div>

      {/* MAIN CONTENT - Scrollable */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
         {/* LEFT: CONTROLS - Wider Panel */}
         <div className="w-full lg:w-96 xl:w-[480px] bg-white border-r border-gray-200 flex flex-col min-w-0">
            <div className="p-6 overflow-y-auto flex-1">
               <div className="space-y-8 min-w-0">
                  
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm ring-1 ring-gray-100 min-w-0">
                     <label className="block text-xs font-bold text-indigo-600 uppercase mb-4 flex items-center gap-2">
                        <MusicalNoteIcon className="w-4 h-4" /> Musical Context
                     </label>
                     <div className="space-y-5 min-w-0">
                        <div className="min-w-0">
                           <span className="text-xs font-semibold text-gray-600 block mb-1.5">Genre</span>
                           <select 
                               value={genre} 
                               onChange={e => setGenre(e.target.value)} 
                               className="w-full p-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm min-w-0"
                           >
                              {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                           </select>
                        </div>
                        <div className="flex gap-4 min-w-0">
                           <div className="flex-1 min-w-0">
                              <span className="text-xs font-semibold text-gray-600 block mb-1.5">Key</span>
                              <select 
                                   value={selectedKey} 
                                   onChange={e => setSelectedKey(e.target.value)} 
                                   className="w-full p-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm min-w-0"
                               >
                                 {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                              </select>
                           </div>
                           <div className="flex-1 min-w-0">
                              <span className="text-xs font-semibold text-gray-600 block mb-1.5">Tempo</span>
                              <input 
                                   type="number" 
                                   value={tempo} 
                                   onChange={e => setTempo(parseInt(e.target.value))} 
                                   className="w-full p-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm min-w-0" 
                               />
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="min-w-0">
                     <label className="block text-xs font-bold text-indigo-600 uppercase mb-4 flex items-center gap-2">
                        <SwatchIcon className="w-4 h-4" /> Mood & Vibe
                     </label>
                     <div className="flex flex-wrap gap-3 min-w-0">
                        {MOODS.map(m => (
                           <button 
                              key={m} 
                              onClick={() => setMood(m)}
                              className={`px-4 py-2 rounded-full text-sm font-bold border transition-all shadow-sm flex-shrink-0 ${
                                  mood === m 
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-200' 
                                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                              }`}
                           >
                              {m}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="min-w-0">
                     <label className="block text-xs font-bold text-indigo-600 uppercase mb-4 flex items-center gap-2">
                        <CursorArrowRaysIcon className="w-4 h-4" /> Custom Prompt
                     </label>
                     <textarea 
                        value={description} 
                        onChange={e => setDescription(e.target.value)}
                        placeholder="e.g. Simple drum beat with a funky bassline and some Rhodes chords..."
                        className="w-full p-4 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-800 h-32 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-sm placeholder-gray-400 min-w-0"
                     />
                  </div>

                  <button 
                     onClick={handleGenerate}
                     disabled={loading}
                     className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:transform-none disabled:shadow-none min-w-0 text-base"
                  >
                     {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <SparklesIcon className="w-6 h-6 text-indigo-100" />}
                     Generate Track
                  </button>
               </div>
            </div>
         </div>

         {/* RIGHT: PLAYER - Narrower Panel */}
         <div className="flex-1 bg-gradient-to-br from-white to-indigo-50/50 flex flex-col min-w-0 overflow-hidden">
            <div className="p-6 overflow-y-auto flex-1 min-w-0">
               
               {trackData ? (
                  <div className="w-full space-y-6 animate-fade-in min-w-0">
                     
                     {/* INFO CARD */}
                     <div className="bg-white p-6 rounded-2xl shadow-lg shadow-indigo-100/50 border border-indigo-50 flex flex-col md:flex-row items-center justify-between gap-6 min-w-0">
                        <div className="text-center md:text-left min-w-0">
                           <h2 className="text-2xl font-black text-gray-900 tracking-tight truncate">{trackData.title || "Untitled Track"}</h2>
                           <div className="flex items-center justify-center md:justify-start gap-2 mt-1 flex-wrap">
                               <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100 flex-shrink-0">{trackData.style}</span>
                               <span className="text-sm text-gray-400 flex-shrink-0">•</span>
                               <span className="text-sm text-gray-500 font-medium flex-shrink-0">{trackData.bpm} BPM</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-6 bg-gray-50 p-2 pl-4 rounded-full border border-gray-200 flex-shrink-0">
                           <div className="flex items-center gap-3">
                              <SpeakerWaveIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                              <input 
                                 type="range" min="0" max="1" step="0.1" 
                                 value={volume} onChange={e => setVolume(parseFloat(e.target.value))}
                                 className="w-24 h-1.5 bg-gray-300 rounded-full appearance-none cursor-pointer accent-indigo-600 flex-shrink-0"
                              />
                           </div>
                           <button 
                              onClick={handlePlay}
                              className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-200 transition-all transform hover:scale-105 active:scale-95 flex-shrink-0 ${isPlaying ? 'bg-rose-500 hover:bg-rose-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                           >
                              {isPlaying ? <StopIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5 ml-1" />}
                           </button>
                        </div>
                     </div>

                     {/* SEQUENCER VISUALIZER */}
                     <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-w-0">
                        <div className="px-6 py-4 border-b border-gray-100 bg-white flex justify-between items-center min-w-0">
                           <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm flex-shrink-0">
                              <AdjustmentsHorizontalIcon className="w-5 h-5 text-indigo-500 flex-shrink-0" /> Live Sequence
                           </h3>
                           <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase bg-gray-50 px-2 py-1 rounded border border-gray-100 flex-shrink-0">16 Step Loop</div>
                        </div>
                        <div className="p-6 space-y-6 bg-white min-w-0">
                           {trackData.tracks.map((track, idx) => (
                              <div key={idx} className="flex flex-col md:flex-row items-start md:items-center gap-4 min-w-0">
                                 <div className="w-24 text-xs font-bold text-gray-400 uppercase tracking-wider md:text-right pt-1 md:pt-0 flex items-center gap-2 md:justify-end flex-shrink-0">
                                     <div className={`w-2 h-2 rounded-full ${track.instrument === 'drums' ? 'bg-orange-400' : track.instrument === 'bass' ? 'bg-purple-400' : 'bg-sky-400'} flex-shrink-0`}></div>
                                     <span className="truncate">{track.instrument}</span>
                                 </div>
                                 <div className="flex-1 w-full grid grid-cols-8 sm:grid-cols-16 gap-1.5 h-12 bg-gray-50 rounded-xl p-2 border border-gray-100 min-w-0 overflow-hidden">
                                    {Array.from({length: 16}).map((_, step) => {
                                       const isActive = track.steps.some(s => s.beat === step && s.notes.length > 0);
                                       const isCurrent = currentStep === step;
                                       
                                       // Color Logic
                                       let baseColor = 'bg-gray-200';
                                       if (isActive) {
                                           if (track.instrument === 'drums') baseColor = 'bg-orange-400';
                                           else if (track.instrument === 'bass') baseColor = 'bg-purple-500';
                                           else baseColor = 'bg-sky-500';
                                       }

                                       return (
                                          <div 
                                             key={step}
                                             className={`rounded transition-all duration-100 flex-shrink-0 ${
                                                isActive 
                                                   ? (isCurrent ? 'brightness-125 scale-105 shadow-md' : `${baseColor} shadow-sm`) 
                                                   : (isCurrent ? 'bg-gray-300' : 'bg-white border border-gray-100')
                                             }`}
                                          ></div>
                                       );
                                    })}
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>

                     {/* YOUTUBE SUGGESTIONS */}
                     {trackData.youtubeQueries && trackData.youtubeQueries.length > 0 && (
                        <div className="pt-6 border-t border-gray-200/50 min-w-0">
                           <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Jam Along With Real Tracks</h3>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                              {trackData.youtubeQueries.map((query, i) => (
                                 <button 
                                    key={i}
                                    onClick={() => openYouTube(query)}
                                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-red-200 hover:shadow-md hover:shadow-red-50 group transition-all text-left min-w-0"
                                 >
                                    <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1">
                                        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors shrink-0">
                                            <PlayIcon className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900 truncate min-w-0">{query}</span>
                                    </div>
                                    <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-300 group-hover:text-red-400 flex-shrink-0" />
                                 </button>
                              ))}
                           </div>
                        </div>
                     )}

                  </div>
               ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-100 py-8 min-w-0">
                     <div className="w-32 h-32 bg-white rounded-full shadow-xl shadow-indigo-100 flex items-center justify-center mb-8 border border-indigo-50 animate-pulse flex-shrink-0">
                        <SparklesIcon className="w-12 h-12 text-indigo-400 flex-shrink-0" />
                     </div>
                     <h3 className="text-2xl font-bold text-gray-900 mb-2">Studio is Quiet</h3>
                     <p className="text-gray-500 mt-2 max-w-sm text-lg leading-relaxed">
                        Configure your style on the left and hit <span className="font-bold text-indigo-600">Generate</span> to create a unique AI backing track.
                     </p>
                  </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default BackingTrack;