import { create } from 'zustand';
import { Pelada, Jogo } from '@/types/database';

interface PeladaState {
  pelada: Pelada | null;
  proximoJogo: Jogo | null;
  setPelada: (pelada: Pelada | null) => void;
  setProximoJogo: (jogo: Jogo | null) => void;
}

export const usePeladaStore = create<PeladaState>((set) => ({
  pelada: null,
  proximoJogo: null,
  setPelada: (pelada) => set({ pelada }),
  setProximoJogo: (proximoJogo) => set({ proximoJogo }),
}));
