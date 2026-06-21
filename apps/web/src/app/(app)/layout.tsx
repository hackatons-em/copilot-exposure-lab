import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { GuidedDemoProvider } from "@/components/guided/GuidedDemo";
import { WorkspaceProvider } from "@/components/WorkspaceProvider";

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return (
    <WorkspaceProvider>
      <GuidedDemoProvider>
        <AppShell>{children}</AppShell>
      </GuidedDemoProvider>
    </WorkspaceProvider>
  );
}
