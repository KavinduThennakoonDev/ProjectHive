"use client";

import { useState } from "react";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiClientError, apiFetch, getErrorMessage } from "@/lib/api-client";
import { loginSchema } from "@/lib/validation/auth";
import { toFieldErrors } from "@/lib/validation/common";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});
    setPending(true);

    try {
      await apiFetch("/api/auth/login", { method: "POST", body: parsed.data });
      // A full page load so every page picks up the new session.
      window.location.assign(redirectTo);
    } catch (error) {
      if (error instanceof ApiClientError) setFieldErrors(error.fieldErrors);
      setFormError(getErrorMessage(error));
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          {formError}
        </div>
      )}

      <FormField label="Email" htmlFor="email" error={fieldErrors.email}>
        <Input
          id="email"
          type="email"
          autoComplete="username"
          placeholder="admin@projecthive.lk"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(fieldErrors.email) || undefined}
          className="h-10"
          autoFocus
        />
      </FormField>

      <FormField label="Password" htmlFor="password" error={fieldErrors.password}>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={Boolean(fieldErrors.password) || undefined}
          className="h-10"
        />
      </FormField>

      <Button type="submit" className="h-10 w-full" disabled={pending}>
        {pending && <LoaderCircle className="animate-spin" />}
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
