import { create } from 'zustand';

interface SearchStore {
  activeSearchQuery: string;
  triggerSearchId: number;
  triggerSearch: (query: string) => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
  activeSearchQuery: '',
  triggerSearchId: 0,
  triggerSearch: (query) => set((state) => ({
    activeSearchQuery: query,
    triggerSearchId: state.triggerSearchId + 1
  })),
}));
