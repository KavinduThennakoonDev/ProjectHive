import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Shows a "back" link above the title. */
  back?: { href: string; label: string };
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, back, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 space-y-3">
      {back && (
        <Link
          href={back.href}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <div className="text-sm text-muted-foreground">{description}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
