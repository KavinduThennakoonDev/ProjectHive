import Image from "next/image";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** The hexagon "P" mark with the ProjectHive wordmark next to it. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <Image src="/logo-mark.png" alt="" width={32} height={32} className="size-8" priority />
      <span className="text-lg font-bold tracking-tight text-foreground">
        Project<span className="text-primary">Hive</span>
      </span>
    </span>
  );
}

/** The full stacked logo, used on the login page. */
export function LogoFull({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt={APP_NAME}
      width={640}
      height={480}
      className={cn("h-auto w-40", className)}
      priority
    />
  );
}
