"use client";

import { useUploadStore } from "@/store/useUploadStore";
import UploadDropzone from "./UploadDropzone";
import SplitScreenView from "./SplitScreenView";

export default function MainContent() {
  const { file } = useUploadStore();

  return (
    <main className={`container ${file ? 'container-split' : ''}`}>
      {!file ? <UploadDropzone /> : <SplitScreenView />}
    </main>
  );
}
