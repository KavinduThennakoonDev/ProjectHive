"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiClientError, apiFetch, getErrorMessage } from "@/lib/api-client";
import type { AdminDTO } from "@/lib/types";
import { profileSchema } from "@/lib/validation/auth";
import { toFieldErrors } from "@/lib/validation/common";

export function ProfileForm({ admin }: { admin: AdminDTO }) {
  const router = useRouter();
  const [name, setName] = useState(admin.name);
  const [email, setEmail] = useState(admin.email);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = profileSchema.safeParse({ name, email });
    if (!parsed.success) return setErrors(toFieldErrors(parsed.error));

    setErrors({});
    setPending(true);
    try {
      await apiFetch("/api/auth/profile", { method: "PUT", body: parsed.data });
      toast.success("Profile updated");
      router.refresh();
    } catch (error) {
      if (error instanceof ApiClientError) setErrors(error.fieldErrors);
      toast.error(getErrorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your name and the email you use to log in.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField label="Name" htmlFor="profile-name" error={errors.name} required>
            <Input
              id="profile-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={Boolean(errors.name) || undefined}
              maxLength={100}
            />
          </FormField>
          <FormField label="Email" htmlFor="profile-email" error={errors.email} required>
            <Input
              id="profile-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(errors.email) || undefined}
              maxLength={200}
            />
          </FormField>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={pending}>
            {pending && <LoaderCircle className="animate-spin" />}
            Save Profile
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
