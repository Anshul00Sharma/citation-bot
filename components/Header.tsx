"use client";

import { useUploadStore } from "@/store/useUploadStore";

export default function Header() {
  const { file } = useUploadStore();

  return (
    <div className={`title-wrapper ${file ? 'title-shifted' : ''}`}>
      <h1 className="title-text">
        Citation Bot
      </h1>
    </div>
  );
}
