"use client";

import { ReactNode } from "react";

// Auth protection is now handled by middleware
// This component is just a pass-through
export function AuthProtection({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
