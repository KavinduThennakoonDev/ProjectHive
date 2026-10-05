"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { PaymentStatusBadge } from "@/components/shared/badges";
import { FormField } from "@/components/shared/form-field";
import { OptionSelect, toOptions } from "@/components/shared/option-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError, apiFetch, getErrorMessage } from "@/lib/api-client";
import {
  PRIORITIES,
  PRIORITY_LABELS,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  PROJECT_TYPES,
  PROJECT_TYPE_LABELS,
} from "@/lib/constants";
import { toDateOnly } from "@/lib/dates";
import { calculateFinancials, derivePaymentStatus } from "@/lib/finance";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { DeveloperSummary, ProjectDTO } from "@/lib/types";
import { toFieldErrors } from "@/lib/validation/common";
import { projectInputSchema } from "@/lib/validation/project";

const NO_DEVELOPER = "none";

const TYPE_OPTIONS = toOptions(PROJECT_TYPES, PROJECT_TYPE_LABELS);
const PRIORITY_OPTIONS = toOptions(PRIORITIES, PRIORITY_LABELS);
const STATUS_OPTIONS = toOptions(PROJECT_STATUSES, PROJECT_STATUS_LABELS);

/** Everything is kept as text while the admin is typing. */
interface FormValues {
  projectName: string;
  projectType: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  description: string;
  subject: string;
  requirements: string;
  technologies: string;
  referenceMaterials: string;
  developerId: string;
  startDate: string;
  deadline: string;
  priority: string;
  status: string;
  developerCost: string;
  clientPrice: string;
  advancePaid: string;
  refunded: boolean;
}

function getInitialValues(project?: ProjectDTO): FormValues {
  return {
    projectName: project?.projectName ?? "",
    projectType: project?.projectType ?? "",
    clientName: project?.clientName ?? "",
    clientPhone: project?.clientPhone ?? "",
    clientEmail: project?.clientEmail ?? "",
    description: project?.description ?? "",
    subject: project?.subject ?? "",
    requirements: project?.requirements ?? "",
    technologies: project?.technologies ?? "",
    referenceMaterials: project?.referenceMaterials ?? "",
    developerId: project?.developerId ?? NO_DEVELOPER,
    startDate: toDateOnly(project?.startDate),
    deadline: toDateOnly(project?.deadline),
    priority: project?.priority ?? "MEDIUM",
    status: project?.status ?? "NEW",
    developerCost: project ? String(project.developerCost) : "",
    clientPrice: project ? String(project.clientPrice) : "",
    advancePaid: project ? String(project.advancePaid) : "",
    refunded: project?.paymentStatus === "REFUNDED",
  };
}

/** "" -> undefined (so "required" messages show), anything else -> number. */
function toAmount(value: string): number | undefined {
  return value.trim() === "" ? undefined : Number(value);
}

function toPayload(values: FormValues) {
  return {
    ...values,
    projectType: values.projectType || undefined,
    developerId: values.developerId === NO_DEVELOPER ? null : values.developerId,
    startDate: values.startDate || null,
    developerCost: toAmount(values.developerCost),
    clientPrice: toAmount(values.clientPrice),
    advancePaid: toAmount(values.advancePaid) ?? 0,
  };
}

function SummaryRow({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "text-base font-semibold tabular-nums" : "font-medium tabular-nums"}>{value}</span>
    </div>
  );
}

interface ProjectFormProps {
  developers: DeveloperSummary[];
  /** When given, the form edits this project instead of creating a new one. */
  project?: ProjectDTO;
}

export function ProjectForm({ developers, project }: ProjectFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(() => getInitialValues(project));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  const isEdit = Boolean(project);
  const cancelHref = project ? `/projects/${project.id}` : "/projects";

  // Inactive developers can't take new work, but stay selectable if already assigned.
  const developerOptions = [
    { value: NO_DEVELOPER, label: "Not assigned yet" },
    ...developers
      .filter((developer) => developer.status === "ACTIVE" || developer.id === project?.developerId)
      .map((developer) => ({
        value: developer.id,
        label: developer.status === "ACTIVE" ? developer.name : `${developer.name} (Inactive)`,
      })),
  ];

  function setValue<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!(key in current)) return current;
      const rest = { ...current };
      delete rest[key];
      return rest;
    });
  }

  const textProps = (key: Exclude<keyof FormValues, "refunded">) => ({
    id: key,
    value: values[key],
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValue(key, event.target.value),
    "aria-invalid": Boolean(errors[key]) || undefined,
    "aria-describedby": errors[key] ? `${key}-error` : undefined,
  });

  const amountProps = (key: "developerCost" | "clientPrice" | "advancePaid") => ({
    ...textProps(key),
    type: "number",
    inputMode: "decimal" as const,
    min: 0,
    step: "0.01",
    placeholder: "0.00",
  });

  // Live preview only. The server recalculates everything when the project is saved.
  const amounts = {
    clientPrice: Math.max(Number(values.clientPrice) || 0, 0),
    developerCost: Math.max(Number(values.developerCost) || 0, 0),
    advancePaid: Math.max(Number(values.advancePaid) || 0, 0),
  };
  const preview = calculateFinancials(amounts);
  const paymentStatus = derivePaymentStatus(amounts.clientPrice, amounts.advancePaid, values.refunded);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = projectInputSchema.safeParse(toPayload(values));
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error));
      toast.error("Please check the highlighted fields.");
      return;
    }

    setErrors({});
    setPending(true);
    try {
      const saved = await apiFetch<ProjectDTO>(project ? `/api/projects/${project.id}` : "/api/projects", {
        method: project ? "PUT" : "POST",
        body: parsed.data,
      });
      toast.success(project ? "Project updated" : `Project ${saved.projectCode} created`);
      router.push(`/projects/${saved.id}`);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiClientError) setErrors(error.fieldErrors);
      toast.error(getErrorMessage(error));
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>What the project is and who it is for.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField label="Project Name" htmlFor="projectName" error={errors.projectName} required>
              <Input {...textProps("projectName")} placeholder="e.g. E-Commerce Website" maxLength={150} />
            </FormField>
            <FormField label="Project Type" htmlFor="projectType" error={errors.projectType} required>
              <OptionSelect
                id="projectType"
                value={values.projectType}
                onValueChange={(value) => setValue("projectType", value)}
                options={TYPE_OPTIONS}
                placeholder="Select a type"
                invalid={Boolean(errors.projectType)}
              />
            </FormField>
            <FormField label="Client Name" htmlFor="clientName" error={errors.clientName} required>
              <Input {...textProps("clientName")} placeholder="Client or student name" maxLength={100} />
            </FormField>
            <FormField label="Client Contact Number" htmlFor="clientPhone" error={errors.clientPhone}>
              <Input {...textProps("clientPhone")} type="tel" placeholder="+94 77 123 4567" maxLength={20} />
            </FormField>
            <FormField label="Client Email" htmlFor="clientEmail" error={errors.clientEmail} className="md:col-span-2">
              <Input {...textProps("clientEmail")} type="email" placeholder="client@example.com" maxLength={200} />
            </FormField>
            <FormField label="Description" htmlFor="description" error={errors.description} className="md:col-span-2">
              <Textarea {...textProps("description")} rows={3} placeholder="A short summary of the project" />
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assignment / Research Details</CardTitle>
            <CardDescription>Optional details that help the developer do the work.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField label="Subject / Course" htmlFor="subject" error={errors.subject}>
              <Input {...textProps("subject")} placeholder="e.g. Database Management Systems" maxLength={200} />
            </FormField>
            <FormField label="Technology / Tools" htmlFor="technologies" error={errors.technologies}>
              <Input {...textProps("technologies")} placeholder="e.g. Python, MySQL" maxLength={500} />
            </FormField>
            <FormField label="Requirements" htmlFor="requirements" error={errors.requirements} className="md:col-span-2">
              <Textarea {...textProps("requirements")} rows={4} placeholder="What needs to be delivered" />
            </FormField>
            <FormField
              label="Reference Materials"
              htmlFor="referenceMaterials"
              error={errors.referenceMaterials}
              className="md:col-span-2"
            >
              <Textarea {...textProps("referenceMaterials")} rows={2} placeholder="Links, briefs or files the client shared" />
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Management</CardTitle>
            <CardDescription>Who is doing the work and when it is due.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              label="Developer"
              htmlFor="developerId"
              error={errors.developerId}
              hint={developers.length === 0 ? "Add developers on the Developers page first." : undefined}
            >
              <OptionSelect
                id="developerId"
                value={values.developerId}
                onValueChange={(value) => setValue("developerId", value)}
                options={developerOptions}
                invalid={Boolean(errors.developerId)}
              />
            </FormField>
            <FormField label="Status" htmlFor="status" error={errors.status}>
              <OptionSelect
                id="status"
                value={values.status}
                onValueChange={(value) => setValue("status", value)}
                options={STATUS_OPTIONS}
                invalid={Boolean(errors.status)}
              />
            </FormField>
            <FormField label="Start Date" htmlFor="startDate" error={errors.startDate}>
              <Input {...textProps("startDate")} type="date" />
            </FormField>
            <FormField label="Deadline" htmlFor="deadline" error={errors.deadline} required>
              <Input {...textProps("deadline")} type="date" min={values.startDate || undefined} />
            </FormField>
            <FormField label="Priority" htmlFor="priority" error={errors.priority}>
              <OptionSelect
                id="priority"
                value={values.priority}
                onValueChange={(value) => setValue("priority", value)}
                options={PRIORITY_OPTIONS}
                invalid={Boolean(errors.priority)}
              />
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Details</CardTitle>
            <CardDescription>All amounts are in Sri Lankan Rupees (LKR).</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              label="Client Price (Rs.)"
              htmlFor="clientPrice"
              error={errors.clientPrice}
              hint="What ProjectHive charges the client."
              required
            >
              <Input {...amountProps("clientPrice")} />
            </FormField>
            <FormField
              label="Developer Cost (Rs.)"
              htmlFor="developerCost"
              error={errors.developerCost}
              hint="What the developer charges ProjectHive."
              required
            >
              <Input {...amountProps("developerCost")} />
            </FormField>
            <FormField
              label="Client Advance / Paid Amount (Rs.)"
              htmlFor="advancePaid"
              error={errors.advancePaid}
              hint="Total the client has paid so far."
            >
              <Input {...amountProps("advancePaid")} />
            </FormField>
            <FormField label="Remaining Amount (Rs.)" htmlFor="remainingAmount" hint="Client Price − Paid Amount">
              <Input id="remainingAmount" value={formatCurrency(preview.remainingAmount)} readOnly disabled />
            </FormField>
            <div className="flex items-center gap-2 md:col-span-2">
              <Checkbox
                id="refunded"
                checked={values.refunded}
                onCheckedChange={(checked) => setValue("refunded", checked === true)}
              />
              <Label htmlFor="refunded" className="font-normal">
                The payment was refunded to the client
              </Label>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 xl:sticky xl:top-22 xl:self-start">
        <Card>
          <CardHeader>
            <CardTitle>Profit Summary</CardTitle>
            <CardDescription>Updates as you type.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <SummaryRow label="Client Price" value={formatCurrency(amounts.clientPrice)} />
            <SummaryRow label="Developer Cost" value={`− ${formatCurrency(amounts.developerCost)}`} />
            <div className="border-t pt-2.5">
              <SummaryRow
                label="ProjectHive Profit"
                strong
                value={
                  <span className={preview.profit < 0 ? "text-red-600" : "text-emerald-700"}>
                    {formatCurrency(preview.profit)}
                  </span>
                }
              />
            </div>
            <SummaryRow label="Profit %" value={formatPercent(preview.profitPercent)} />
            <div className="space-y-2.5 border-t pt-2.5">
              <SummaryRow label="Paid by client" value={formatCurrency(amounts.advancePaid)} />
              <SummaryRow label="Remaining payment" value={formatCurrency(preview.remainingAmount)} />
              <SummaryRow label="Payment status" value={<PaymentStatusBadge status={paymentStatus} />} />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2">
          <Button type="submit" size="lg" disabled={pending}>
            {pending && <LoaderCircle className="animate-spin" />}
            {isEdit ? "Save Changes" : "Create Project"}
          </Button>
          <Button asChild type="button" variant="outline" size="lg">
            <Link href={cancelHref}>Cancel</Link>
          </Button>
        </div>
      </div>
    </form>
  );
}
