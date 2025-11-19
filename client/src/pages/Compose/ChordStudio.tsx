// src/pages/Compose/ChordStudio.tsx
import React, { useState, useRef } from 'react';

import { aiApi, type Chord, type Substitution, type ChordProgression } from '../../api/apiService';

// Simple icons using Heroicons
const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const BarChartIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const RefreshCwIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const PlayIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PauseIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const Checkbox: React.FC<CheckboxProps> = ({ label, checked, onChange }) => (
  <label className="flex items-center space-x-3 cursor-pointer group">
    <div 
      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
        checked ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300 group-hover:border-indigo-400'
      }`}
      onClick={() => onChange(!checked)}
    >
      {checked && (
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
    <span className="text-sm text-gray-700 font-medium select-none">{label}</span>
  </label>
);

// Audio Synthesis Logic
const NOTE_FREQUENCIES: Record<string, number> = {
  'C': 261.63, 'C#': 277.18, 'Db': 277.18, 'D': 293.66, 'D#': 311.13, 'Eb': 311.13, 
  'E': 329.63, 'F': 349.23, 'F#': 369.99, 'Gb': 369.99, 'G': 392.00, 'G#': 415.30, 
  'Ab': 415.30, 'A': 440.00, 'A#': 466.16, 'Bb': 466.16, 'B': 493.88
};

const playChord = (ctx: AudioContext, chordName: string, time: number, duration: number) => {
  const match = chordName.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return;
  
  const root = match[1];
  const quality = match[2];
  const rootFreq = NOTE_FREQUENCIES[root] || 261.63;
  
  let intervals = [0, 4, 7]; 
  
  if (quality.includes('m') && !quality.includes('maj')) intervals = [0, 3, 7];
  if (quality.includes('dim')) intervals = [0, 3, 6];
  if (quality.includes('7')) {
    if (quality.includes('maj')) intervals.push(11);
    else intervals.push(10);
  }

  intervals.forEach((semitone, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = i === 0 ? 'triangle' : 'sine'; 
    const freq = rootFreq * Math.pow(2, semitone/12);
    osc.frequency.value = freq;
    
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.1, time + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration - 0.05);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(time);
    osc.stop(time + duration);
  });
};

// FIXED: ProgressionDisplay with full safety guards
const ProgressionDisplay: React.FC<{ progression: ChordProgression }> = ({ progression }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // ← THIS IS THE ONLY FIX THAT MATTERS
  if (!progression || !progression.progression || !Array.isArray(progression.progression)) {
    return (
      <div className="p-12 text-center bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-lg font-medium text-gray-700">No chord progression available</p>
        <p className="text-sm text-gray-500 mt-2">The server returned incomplete data. Please try generating again.</p>
      </div>
    );
  }

  const handlePlay = async () => {
    if (isPlaying) return;
    
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') await ctx.resume();

    setIsPlaying(true);
    const now = ctx.currentTime;
    let currentTime = now;
    const beatDuration = 0.6;

    progression.progression.forEach((chord) => {
      const duration = chord.duration * beatDuration;
      playChord(ctx, chord.chord, currentTime, duration);
      currentTime += duration;
    });

    const totalDuration = (currentTime - now) * 1000;
    setTimeout(() => setIsPlaying(false), totalDuration);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">{progression.songTitle}</h2>
          <p className="text-sm text-gray-500">by {progression.artist} • Key of {progression.key}</p>
        </div>
        <button 
          onClick={handlePlay}
          disabled={isPlaying}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-full font-semibold transition-all ${
            isPlaying ? 'bg-gray-100 text-gray-400' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
          }`}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
          {isPlaying ? 'Playing...' : 'Play'}
        </button>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-xs uppercase font-bold text-gray-400 mb-3 tracking-wider">Chord Sequence</h3>
        <div className="flex flex-wrap gap-3">
          {progression.progression.map((chord, index) => (
            <div 
              key={index} 
              className="bg-white border border-indigo-100 text-indigo-900 rounded-lg px-4 py-3 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-default"
            >
              <span className="block text-xl font-bold">{chord.chord}</span>
              <span className="block text-xs text-indigo-400 mt-1">{chord.duration} beats</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {Array.isArray(progression.substitutions) && progression.substitutions.length > 0 && (
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
              <RefreshCwIcon />
              Try These Substitutions
            </h3>
            <div className="space-y-3">
              {progression.substitutions.map((sub, index) => (
                <div key={index} className="p-3 bg-white rounded border border-gray-100 hover:border-indigo-200 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="line-through text-gray-400 text-xs font-medium">{sub.originalChord}</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded text-xs">{sub.substitutedChord}</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{sub.theory}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {Array.isArray(progression.practiceTips) && progression.practiceTips.length > 0 && (
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
              <SparklesIcon />
              Practice Tips
            </h3>
            <ul className="space-y-2">
              {progression.practiceTips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-700 text-xs bg-white p-2 rounded border border-gray-100">
                  <span className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-700 font-bold text-xs">
                    {index + 1}
                  </span>
                  <span className="mt-0.5">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

const ChordStudio: React.FC = () => {
  const [search, setSearch] = useState('');
  const [simplify, setSimplify] = useState(true);
  const [useBackingTrack, setUseBackingTrack] = useState(true);
  const [helpPractice, setHelpPractice] = useState(true);
  const [showSubstitutions, setShowSubstitutions] = useState(true);

  const [progression, setProgression] = useState<ChordProgression | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleGenerate = async () => {
    if (!search.trim()) {
      setError("Please enter a song title to generate a progression.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setProgression(null);

    try {
      const result = await aiApi.generateSongArrangement({
        songQuery: search,
        simplify,
        helpPractice,
        showSubstitutions,
        instrument: 'Guitar' 
      });
      setProgression(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate progression. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setSearch('');
    setProgression(null);
    setError(null);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Chord Progression Generator
          </h1>
          <p className="text-sm text-gray-500">
            Enter a song title to get chords, substitutions, and practice tips.
          </p>
        </header>

        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleGenerate()}
              placeholder="Search for a song (e.g., 'Imagine', 'Let it Be')..."
              className="w-full pl-10 pr-32 py-3 text-sm bg-transparent border-none focus:ring-0 text-gray-900 placeholder-gray-400"
            />
            <div className="absolute inset-y-1 right-1">
              <button
                onClick={handleGenerate}
                disabled={isLoading || !search}
                className="h-full px-6 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all text-sm"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Thinking...
                  </span>
                ) : 'Generate'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-12 gap-6">
          <div className="md:col-span-3 space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Customization</h3>
              <div className="space-y-3">
                <Checkbox label="Simplify Chords" checked={simplify} onChange={setSimplify} />
                <Checkbox label="Play Audio Preview" checked={useBackingTrack} onChange={setUseBackingTrack} /> 
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">AI Output</h3>
              <div className="space-y-3">
                <Checkbox label="Practice Tips" checked={helpPractice} onChange={setHelpPractice} />
                <Checkbox label="Theory Substitutions" checked={showSubstitutions} onChange={setShowSubstitutions} />
              </div>
            </div>
            
            <div className="flex flex-col space-y-2">
              <button className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 hover:text-indigo-600 transition-colors">
                <BarChartIcon />
                View History
              </button>
              <button 
                onClick={handleClear}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 hover:text-indigo-600 transition-colors"
              >
                <RefreshCwIcon />
                Clear Results
              </button>
            </div>
          </div>

          <div className="md:col-span-9">
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-100 border-t-indigo-600 mb-4"></div>
                <h3 className="text-base font-semibold text-gray-800">Composing your lesson...</h3>
                <p className="text-gray-500 text-sm mt-1">Analyzing harmony and generating tips</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-start gap-3">
                <div className="p-1 bg-red-100 rounded-full text-red-600 shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <strong className="block font-bold text-sm mb-1">Generation Failed</strong>
                  <span className="block opacity-90 text-xs">{error}</span>
                </div>
              </div>
            )}

            {!isLoading && !error && !progression && (
              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 rounded-lg text-center">
                <div className="p-3 bg-indigo-50 rounded-full text-indigo-400 mb-3">
                  <SparklesIcon />
                </div>
                <h3 className="text-base font-medium text-gray-900">Ready to Create</h3>
                <p className="text-gray-500 text-xs mt-1 max-w-sm">Enter a song above to generate a chord chart and practice guide.</p>
              </div>
            )}

            {progression && <ProgressionDisplay progression={progression} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChordStudio;