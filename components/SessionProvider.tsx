"use client";

import { useHandshake } from "@/hooks/useHandshake";

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useHandshake();

  return <>{children}</>;
}
