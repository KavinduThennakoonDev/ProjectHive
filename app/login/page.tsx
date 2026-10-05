import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { LogoFull } from "@/components/shared/logo";
import { getCurrentAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Log in" };

/** Only allow redirects back into this app, e.g. "/projects/123". */
function getSafeRedirect(from: string | string[] | undefined): string {
  if (typeof from !== "string" || !from.startsWith("/") || from.startsWith("//") || from.startsWith("/login")) {
    return "/dashboard";
  }
  return from;
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const redirectTo = getSafeRedirect((await searchParams).from);
  if (await getCurrentAdmin()) redirect(redirectTo);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border bg-card p-8 shadow-sm">
          <div className="mb-6 flex flex-col items-center gap-4 text-center">
            <LogoFull />
            <div className="space-y-1">
              <h1 className="text-xl font-semibold tracking-tight">Admin login</h1>
              <p className="text-sm text-muted-foreground">Sign in to manage projects, developers and profit.</p>
            </div>
          </div>
          <LoginForm redirectTo={redirectTo} />
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Accounts are created by the system administrator.
        </p>
      </div>
    </main>
  );
}
