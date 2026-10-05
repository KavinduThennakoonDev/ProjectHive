"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/shared/form-field";
import { OptionSelect, toOptions } from "@/components/shared/option-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError, apiFetch, getErrorMessage } from "@/lib/api-client";
import { DEVELOPER_STATUSES, DEVELOPER_STATUS_LABELS } from "@/lib/constants";
import type { DeveloperDTO } from "@/lib/types";
import { toFieldErrors } from "@/lib/validation/common";
import { developerInputSchema } from "@/lib/validation/developer";

const STATUS_OPTIONS = toOptions(DEVELOPER_STATUSES, DEVELOPER_STATUS_LABELS);

interface FormValues {
  name: string;
  phone: string;
  email: string;
  /** Comma-separated while editing, e.g. "React, Node.js". */
  skills: string;
  notes: string;
  status: string;
}

function parseSkills(value: string): string[] {
  const skills = value
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
  return [...new Set(skills)];
}

interface DeveloperFormProps {
  /** When given, the form edits this developer instead of creating a new one. */
  developer?: DeveloperDTO;
}

export function DeveloperForm({ developer }: DeveloperFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>({
    name: developer?.name ?? "",
    phone: developer?.phone ?? "",
    email: developer?.email ?? "",
    skills: developer?.skills.join(", ") ?? "",
    notes: developer?.notes ?? "",
    status: developer?.status ?? "ACTIVE",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  const cancelHref = developer ? `/developers/${developer.id}` : "/developers";

  function setValue(key: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  const fieldProps = (key: keyof FormValues) => ({
    id: key,
    value: values[key],
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValue(key, event.target.value),
    "aria-invalid": Boolean(errors[key]) || undefined,
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = developerInputSchema.safeParse({ ...values, skills: parseSkills(values.skills) });
    if (!parsed.success) {
      const fieldErrors = toFieldErrors(parsed.error);
      // Errors for a single skill ("skills.2") are shown under the skills field.
      const skillError = Object.entries(fieldErrors).find(([key]) => key.startsWith("skills"))?.[1];
      setErrors(skillError ? { ...fieldErrors, skills: skillError } : fieldErrors);
      return;
    }

    setErrors({});
    setPending(true);
    try {
      const saved = await apiFetch<DeveloperDTO>(developer ? `/api/developers/${developer.id}` : "/api/developers", {
        method: developer ? "PUT" : "POST",
        body: parsed.data,
      });
      toast.success(developer ? "Developer updated" : "Developer added");
      router.push(`/developers/${saved.id}`);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiClientError) setErrors(error.fieldErrors);
      toast.error(getErrorMessage(error));
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-2xl">
      <Card>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Name" htmlFor="name" error={errors.name} required className="md:col-span-2">
            <Input {...fieldProps("name")} placeholder="Developer's full name" maxLength={100} />
          </FormField>
          <FormField label="Phone" htmlFor="phone" error={errors.phone}>
            <Input {...fieldProps("phone")} type="tel" placeholder="+94 77 123 4567" maxLength={20} />
          </FormField>
          <FormField label="Email" htmlFor="email" error={errors.email}>
            <Input {...fieldProps("email")} type="email" placeholder="developer@example.com" maxLength={200} />
          </FormField>
          <FormField
            label="Skills"
            htmlFor="skills"
            error={errors.skills}
            hint="Separate skills with commas."
            className="md:col-span-2"
          >
            <Input {...fieldProps("skills")} placeholder="e.g. React, Python, Machine Learning" />
          </FormField>
          <FormField label="Status" htmlFor="status" error={errors.status} hint="Inactive developers cannot be given new projects.">
            <OptionSelect
              id="status"
              value={values.status}
              onValueChange={(value) => setValue("status", value)}
              options={STATUS_OPTIONS}
            />
          </FormField>
          <FormField label="Notes" htmlFor="notes" error={errors.notes} className="md:col-span-2">
            <Textarea {...fieldProps("notes")} rows={3} placeholder="Rates, availability or anything worth remembering" />
          </FormField>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button asChild type="button" variant="outline">
            <Link href={cancelHref}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={pending}>
            {pending && <LoaderCircle className="animate-spin" />}
            {developer ? "Save Changes" : "Add Developer"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
