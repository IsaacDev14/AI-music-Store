// src/api/apiService.ts
import axios from 'axios';

// Base Axios instance
const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ----- TYPES -----
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

// ----- AI ENDPOINTS -----
export const aiApi = {
  generateChordProgression: async (query: {
    songQuery: string;
    simplify?: boolean;
    helpPractice?: boolean;
    showSubstitutions?: boolean;
  }): Promise<ChordProgression> => {
    const res = await api.post<ChordProgression>('/ai/chords', query);
    return res.data;
  },
};

export default api;