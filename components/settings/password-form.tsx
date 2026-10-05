"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiClientError, apiFetch, getErrorMessage } from "@/lib/api-client";
import { passwordChangeSchema } from "@/lib/validation/auth";
import { toFieldErrors } from "@/lib/validation/common";

const EMPTY = { currentPassword: "", newPassword: "", confirmPassword: "" };

export function PasswordForm() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  const fieldProps = (key: keyof typeof EMPTY) => ({
    id: key,
    type: "password",
    value: values[key],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
      setValues((current) => ({ ...current, [key]: event.target.value })),
    "aria-invalid": Boolean(errors[key]) || undefined,
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = passwordChangeSchema.safeParse(values);
    if (!parsed.success) return setErrors(toFieldErrors(parsed.error));

    setErrors({});
    setPending(true);
    try {
      await apiFetch("/api/auth/password", { method: "PUT", body: parsed.data });
      toast.success("Password changed. Other devices have been signed out.");
      setValues(EMPTY);
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
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Use at least 8 characters. If you are still using the default password, change it now.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Current Password"
            htmlFor="currentPassword"
            error={errors.currentPassword}
            className="sm:col-span-2 sm:max-w-[calc(50%-0.5rem)]"
          >
            <Input {...fieldProps("currentPassword")} autoComplete="current-password" />
          </FormField>
          <FormField label="New Password" htmlFor="newPassword" error={errors.newPassword}>
            <Input {...fieldProps("newPassword")} autoComplete="new-password" />
          </FormField>
          <FormField label="Confirm New Password" htmlFor="confirmPassword" error={errors.confirmPassword}>
            <Input {...fieldProps("confirmPassword")} autoComplete="new-password" />
          </FormField>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={pending}>
            {pending && <LoaderCircle className="animate-spin" />}
            Change Password
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
