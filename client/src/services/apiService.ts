// src/api/apiService.ts
import axios from 'axios';
import type { AxiosInstance } from 'axios';

// Base Axios instance
const api: AxiosInstance = axios.create({
  baseURL: 'http://localhost:8000', // FastAPI server
  headers: {
    'Content-Type': 'application/json',
  },
});

// ----- TYPES -----
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface Instrument {
  id: number;
  name: string;
  type: string;
}

export interface Lesson {
  id: number;
  title: string;
  description: string;
  instrument_id: number;
}

export interface Song {
  id: number;
  title: string;
  artist: string;
  key: string;
}

export interface ChordProgression {
  songTitle: string;
  artist: string;
  key: string;
  progression: { chord: string; duration: number }[];
  practiceTips: string[];
  substitutions: { originalChord: string; substitutedChord: string; theory: string }[];
}

// ----- USERS -----
export const usersApi = {
  list: async (): Promise<User[]> => {
    const res = await api.get<User[]>('/users');
    return res.data;
  },
  create: async (user: Partial<User>): Promise<User> => {
    const res = await api.post<User>('/users', user);
    return res.data;
  },
  get: async (id: number): Promise<User> => {
    const res = await api.get<User>(`/users/${id}`);
    return res.data;
  },
};

// ----- INSTRUMENTS -----
export const instrumentsApi = {
  list: async (): Promise<Instrument[]> => {
    const res = await api.get<Instrument[]>('/instruments');
    return res.data;
  },
  create: async (instrument: Partial<Instrument>): Promise<Instrument> => {
    const res = await api.post<Instrument>('/instruments', instrument);
    return res.data;
  },
};

// ----- LESSONS -----
export const lessonsApi = {
  list: async (): Promise<Lesson[]> => {
    const res = await api.get<Lesson[]>('/lessons');
    return res.data;
  },
  create: async (lesson: Partial<Lesson>): Promise<Lesson> => {
    const res = await api.post<Lesson>('/lessons', lesson);
    return res.data;
  },
};

// ----- SONGS -----
export const songsApi = {
  list: async (): Promise<Song[]> => {
    const res = await api.get<Song[]>('/songs');
    return res.data;
  },
  get: async (id: number): Promise<Song> => {
    const res = await api.get<Song>(`/songs/${id}`);
    return res.data;
  },
  create: async (song: Partial<Song>): Promise<Song> => {
    const res = await api.post<Song>('/songs', song);
    return res.data;
  },
};

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