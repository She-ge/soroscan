import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/layout/AppShell";

export default function ContractsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
