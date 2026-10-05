import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { PasswordForm } from "@/components/settings/password-form";
import { ProfileForm } from "@/components/settings/profile-form";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const admin = await requireAdmin();

  return (
    <>
      <PageHeader title="Settings" description="Manage your admin account." />
      <div className="max-w-3xl space-y-6">
        <ProfileForm admin={admin} />
        <PasswordForm />
      </div>
    </>
  );
}
