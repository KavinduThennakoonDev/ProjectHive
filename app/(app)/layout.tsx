import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { requireAdmin } from "@/lib/auth/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="flex min-h-screen flex-col lg:pl-60">
        <Header admin={admin} />
        <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
