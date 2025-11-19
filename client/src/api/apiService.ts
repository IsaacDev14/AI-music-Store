// client/src/api/apiService.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

// Keep your types exactly as they were (your UI depends on this shape)
export interface Chord {
  chord: string;
  duration: number;
}

export interface Substitution {
  originalChord: string;
  substitutedChord: string;
  theory: string;
}

export interface ChordProgression {
  songTitle: string;
  artist: string;
  key: string;
  progression: Chord[];
  substitutions: Substitution[];
  practiceTips: string[];
}

export interface SongArrangementRequest {
  songQuery: string;
  simplify?: boolean;
  helpPractice?: boolean;
  showSubstitutions?: boolean;
  instrument?: 'Guitar' | 'Ukulele' | 'Piano';
}

// THIS IS THE ONLY CHANGE — FULLY DYNAMIC
export const aiApi = {
  generateSongArrangement: async (query: SongArrangementRequest): Promise<ChordProgression> => {
    const res = await api.post('/ai/chords', query);
    const data = res.data;  // This can be ANY shape from Grok or Gemini

    // AI can return anything → we normalize it safely to what your UI expects
    return {
      songTitle: data.songTitle || data.title || query.songQuery || "Unknown Song",
      artist: data.artist || data.Artist || "Unknown Artist",
      key: data.key || data.Key || "C Major",
      progression: 
        data.progression?.length > 0 
          ? data.progression 
          : (data.progressionSummary || ["C", "G", "Am", "F"]).map((chord: string) => ({
              chord,
              duration: 4  // default duration if not provided
            })),
      substitutions: Array.isArray(data.substitutions) ? data.substitutions : [],
      practiceTips: Array.isArray(data.practiceTips) 
        ? data.practiceTips 
        : Array.isArray(data.tips) 
          ? data.tips 
          : ["Practice slowly at first"],
    };
  },
};

export { api };