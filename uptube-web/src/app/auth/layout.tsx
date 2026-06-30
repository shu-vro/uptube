import { AuthGuard } from "@/components/layout/auth-guard";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        {children}
      </div>
    </AuthGuard>
  );
}
