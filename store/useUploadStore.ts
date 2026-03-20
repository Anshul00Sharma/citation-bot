import { create } from 'zustand';

export interface UploadedFile {
  name: string;
  type: string;
  size: number;
  nativeFile: File;
}

interface UploadStore {
  file: UploadedFile | null;
  setFile: (file: UploadedFile | null) => void;
}

export const useUploadStore = create<UploadStore>((set) => ({
  file: null,
  setFile: (file) => set({ file }),
}));
