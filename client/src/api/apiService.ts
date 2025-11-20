import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

/* ==================== INTERFACES ==================== */
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

export interface RhythmPatternResult {
  pattern: string;
  description?: string;
  difficulty?: string;
}

export interface MelodySuggestionResult {
  melody: string;
  description?: string;
  style?: string;
}

export interface ImprovTipsResult {
  response: string;
  scales?: string[];
  targetNotes?: string[];
  techniques?: string[];
}

export interface LyricsResult {
  lyrics: string;
  title?: string;
  structure?: string;
}

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

export interface LessonResult {
  lesson: string;
  title?: string;
  duration?: string;
  goals?: string[];
}

/* ==================== API METHODS ==================== */
export const aiApi = {
  generateSongArrangement: async (query: any): Promise<FullDisplayData> => {
    try {
      const res = await api.post('/ai/chords', query);
      const data = res.data;
      
      // Validate required fields from real AI response
      if (!data.songTitle || !data.artist || !data.key) {
        throw new Error('Incomplete data received from AI service');
      }

      const rawProgression = data.progression || 
        data.progressionSummary?.map((c: string) => ({ chord: c, duration: 4 })) || 
        [];

      return {
        songTitle: data.songTitle,
        artist: data.artist,
        key: data.key,
        tuning: data.tuning || 'E A D G B E',
        capo: data.capoFret > 0 ? `Capo on fret ${data.capoFret}` : undefined,
        progression: Array.isArray(rawProgression) ? rawProgression : [],
        tablature: Array.isArray(data.tablature) ? data.tablature : [],
        chordDiagrams: Array.isArray(data.chordDiagrams) ? data.chordDiagrams : [],
        substitutions: Array.isArray(data.substitutions) ? data.substitutions : [],
        practiceTips: Array.isArray(data.practiceTips) ? data.practiceTips : [],
      };
    } catch (error: any) {
      console.error('Failed to generate song arrangement:', error);
      throw new Error(error.response?.data?.detail || 'Failed to generate song arrangement');
    }
  },

  generateBandArrangement: async (prompt: string): Promise<BackingTrackResult> => {
    try {
      const res = await api.post<BackingTrackResult>('/ai/backing-track', { prompt });
      
      // Validate real AI response
      if (!res.data.tracks || !Array.isArray(res.data.tracks)) {
        throw new Error('Invalid backing track data received');
      }
      
      return res.data;
    } catch (error: any) {
      console.error('Failed to generate backing track:', error);
      throw new Error(error.response?.data?.detail || 'Failed to generate backing track');
    }
  },

  generateRhythmPattern: async (timeSignature: string, level: string): Promise<string> => {
    try {
      const res = await api.post<RhythmPatternResult>('/ai/rhythm', { timeSignature, level });
      
      // Validate real AI response
      if (!res.data.pattern) {
        throw new Error('No rhythm pattern received from AI');
      }
      
      return res.data.pattern;
    } catch (error: any) {
      console.error('Failed to generate rhythm pattern:', error);
      throw new Error(error.response?.data?.detail || 'Failed to generate rhythm pattern');
    }
  },

  generateMelodySuggestion: async (key: string, style: string): Promise<string> => {
    try {
      const res = await api.post<MelodySuggestionResult>('/ai/melody', { key, style });
      
      // Validate real AI response
      if (!res.data.melody) {
        throw new Error('No melody received from AI');
      }
      
      return res.data.melody;
    } catch (error: any) {
      console.error('Failed to generate melody:', error);
      throw new Error(error.response?.data?.detail || 'Failed to generate melody');
    }
  },

  getImprovTips: async (query: string): Promise<string> => {
    try {
      const res = await api.post<ImprovTipsResult>('/ai/improv', { query });
      
      // Validate real AI response
      if (!res.data.response) {
        throw new Error('No improv tips received from AI');
      }
      
      return res.data.response;
    } catch (error: any) {
      console.error('Failed to get improv tips:', error);
      throw new Error(error.response?.data?.detail || 'Failed to get improv tips');
    }
  },

  generateLyrics: async (topic: string, genre: string, mood: string): Promise<string> => {
    try {
      const res = await api.post<LyricsResult>('/ai/lyrics', { topic, genre, mood });
      
      // Validate real AI response
      if (!res.data.lyrics) {
        throw new Error('No lyrics received from AI');
      }
      
      return res.data.lyrics;
    } catch (error: any) {
      console.error('Failed to generate lyrics:', error);
      throw new Error(error.response?.data?.detail || 'Failed to generate lyrics');
    }
  },

  getPracticeAdvice: async (sessions: Session[]): Promise<string> => {
    try {
      const res = await api.post<PracticeAdviceResult>('/ai/practice-advice', { sessions });
      
      // Validate real AI response
      if (!res.data.advice) {
        throw new Error('No practice advice received from AI');
      }
      
      return res.data.advice;
    } catch (error: any) {
      console.error('Failed to get practice advice:', error);
      throw new Error(error.response?.data?.detail || 'Failed to get practice advice');
    }
  },

  generateLesson: async (params: {
    skillLevel: string;
    instrument: string;
    focus: string;
  }): Promise<string> => {
    try {
      const res = await api.post<LessonResult>('/ai/lesson', {
        skill_level: params.skillLevel,
        instrument: params.instrument,
        focus: params.focus,
      });
      
      // Validate real AI response
      if (!res.data.lesson) {
        throw new Error('No lesson content received from AI');
      }
      
      return res.data.lesson;
    } catch (error: any) {
      console.error('Failed to generate lesson:', error);
      throw new Error(error.response?.data?.detail || 'Failed to generate lesson');
    }
  },
};

/* ==================== DIRECT EXPORTS ==================== */
export const generateSongArrangement = aiApi.generateSongArrangement;
export const generateBandArrangement = aiApi.generateBandArrangement;
export const generateRhythmPattern = aiApi.generateRhythmPattern;
export const generateMelodySuggestion = aiApi.generateMelodySuggestion;
export const getImprovTips = aiApi.getImprovTips;
export const generateLyrics = aiApi.generateLyrics;
export const getPracticeAdvice = aiApi.getPracticeAdvice;
export const generateLesson = aiApi.generateLesson;

export { api };