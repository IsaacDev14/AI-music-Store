// client/src/api/apiService.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

export interface Chord {
  chord: string;
  duration: number;
}

export interface Substitution {
  originalChord: string;
  substitutedChord: string;
  theory: string;
}

// New types for full tablature
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

// Final type your UI uses
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

export const aiApi = {
  generateSongArrangement: async (query: any): Promise<FullDisplayData> => {
    const res = await api.post('/ai/chords', query);
    const data = res.data;  // Can be ANY shape from Grok or Gemini

    // Extract progression from various possible sources
    const rawProgression = data.progression || 
                          data.progressionSummary?.map((c: string) => ({ chord: c, duration: 4 })) || 
                          [];

    return {
      songTitle: data.songTitle || data.title || query.songQuery || "Unknown Song",
      artist: data.artist || "Unknown Artist",
      key: data.key || "C Major",
      tuning: data.tuning || "E A D G B E",
      capo: data.capoFret > 0 ? `Capo on fret ${data.capoFret}` : "No capo",
      progression: Array.isArray(rawProgression) ? rawProgression : [],
      tablature: Array.isArray(data.tablature) ? data.tablature : [],
      chordDiagrams: Array.isArray(data.chordDiagrams) ? data.chordDiagrams : [],
      substitutions: Array.isArray(data.substitutions) ? data.substitutions : [],
      practiceTips: Array.isArray(data.practiceTips) ? data.practiceTips : [],
    };
  },
};

export { api };