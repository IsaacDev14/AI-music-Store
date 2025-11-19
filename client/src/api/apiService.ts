// client/src/api/apiService.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

/* ========== CHORD & SONG ARRANGEMENT ========== */
export interface Chord {
  chord: string;
  duration: number;
}

export interface Substitution {
  originalChord: string;
  substitutedChord: string;
  theory: string;
}

export interface TabLine {
  lyrics: string;
  isChordLine: boolean;
}

export interface TabSection {
  section: string;
  lines: TabLine[];
}

export interface ChordDiagram {
  chord: string;
  frets: (number | 'X')[];
  fingers: (number | null)[];
  capoFret: number;
}

export interface FullDisplayData {
  songTitle: string;
  artist: string;
  key: string;
  tuning: string;
  capo?: string;
  progression: Chord[];
  tablature: TabSection[];
  chordDiagrams: ChordDiagram[];
  substitutions: Substitution[];
  practiceTips: string[];
}

/* ========== BACKING TRACK GENERATOR ========== */
export interface BackingTrackStep {
  beat: number;
  notes: string[];
  duration?: number;
}

export interface BackingTrackInstrument {
  instrument: 'drums' | 'bass' | 'keys' | 'guitar' | 'synth';
  steps: BackingTrackStep[];
}

export interface BackingTrackResult {
  title: string;
  style: string;
  bpm: number;
  key: string;
  tracks: BackingTrackInstrument[];
  youtubeQueries?: string[];
  description?: string;
}

/* ========== RHYTHM TRAINER ========== */
export interface RhythmPatternResult {
  pattern: string;
  description?: string;
  difficulty?: string;
}

/* ========== MELODY GENERATOR ========== */
export interface MelodySuggestionResult {
  melody: string;
  description?: string;
  style?: string;
}

/* ========== IMPROV ASSISTANT ========== */
export interface ImprovTipsResult {
  response: string;
  scales?: string[];
  targetNotes?: string[];
  techniques?: string[];
}

/* ========== SONGWRITER (LYRICS) ========== */
export interface LyricsResult {
  lyrics: string;
  title?: string;
  structure?: string;
}

/* ========== PRACTICE LOG + AI COACH ========== */
export interface Session {
  id: string;
  date: string;
  duration: number;
  instrument: string;
  focus: string;
  notes: string;
}

export interface PracticeAdviceResult {
  advice: string;
  insights?: string[];
  nextGoals?: string[];
}

/* ========== API METHODS ========== */
export const aiApi = {
  generateSongArrangement: async (query: any): Promise<FullDisplayData> => {
    const res = await api.post('/ai/chords', query);
    const data = res.data;

    const rawProgression =
      data.progression ||
      data.progressionSummary?.map((c: string) => ({ chord: c, duration: 4 })) ||
      [];

    return {
      songTitle: data.songTitle || data.title || query.songQuery || 'Unknown Song',
      artist: data.artist || 'Unknown Artist',
      key: data.key || 'C Major',
      tuning: data.tuning || 'E A D G B E',
      capo: data.capoFret > 0 ? `Capo on fret ${data.capoFret}` : undefined,
      progression: Array.isArray(rawProgression) ? rawProgression : [], // ← FIXED HERE
      tablature: Array.isArray(data.tablature) ? data.tablature : [],
      chordDiagrams: Array.isArray(data.chordDiagrams) ? data.chordDiagrams : [],
      substitutions: Array.isArray(data.substitutions) ? data.substitutions : [],
      practiceTips: Array.isArray(data.practiceTips) ? data.practiceTips : [],
    };
  },

  generateBandArrangement: async (prompt: string): Promise<BackingTrackResult> => {
    const res = await api.post<BackingTrackResult>('/ai/backing-track', { prompt });
    return res.data;
  },

  generateRhythmPattern: async (timeSignature: string, level: string): Promise<string> => {
    const res = await api.post<RhythmPatternResult>('/ai/rhythm', { timeSignature, level });
    return res.data.pattern || 'x-x-x-x-';
  },

  generateMelodySuggestion: async (key: string, style: string): Promise<string> => {
    const res = await api.post<MelodySuggestionResult>('/ai/melody', { key, style });
    return res.data.melody || 'C4 E4 G4 C5 | B4 G4 E4 C4';
  },

  getImprovTips: async (query: string): Promise<string> => {
    const res = await api.post<ImprovTipsResult>('/ai/improv', { query });
    return res.data.response || 'Try targeting chord tones on strong beats and using the 9th for tension.';
  },

  generateLyrics: async (topic: string, genre: string, mood: string): Promise<string> => {
    const res = await api.post<LyricsResult>('/ai/lyrics', { topic, genre, mood });
    return res.data.lyrics || '[No lyrics generated]';
  },

  getPracticeAdvice: async (sessions: Session[]): Promise<string> => {
    const res = await api.post<PracticeAdviceResult>('/ai/practice-advice', { sessions });
    return res.data.advice || 'Keep up the great work! Consistency is key.';
  },
};

/* ========== DIRECT EXPORTS ========== */
export const generateSongArrangement = aiApi.generateSongArrangement;
export const generateBandArrangement = aiApi.generateBandArrangement;
export const generateRhythmPattern = aiApi.generateRhythmPattern;
export const generateMelodySuggestion = aiApi.generateMelodySuggestion;
export const getImprovTips = aiApi.getImprovTips;
export const generateLyrics = aiApi.generateLyrics;
export const getPracticeAdvice = aiApi.getPracticeAdvice;

/* ========== AXIOS INSTANCE ========== */
export { api };