import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { WorkspaceProvider } from "@/components/WorkspaceProvider";

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return (
    <WorkspaceProvider>
      <AppShell>{children}</AppShell>
    </WorkspaceProvider>
  );
}
