import { prisma } from "@/lib/db";
import { today } from "@/lib/dates";

export function formatProjectCode(year: number, sequence: number): string {
  return `PH-${year}-${String(sequence).padStart(4, "0")}`;
}

/** Reserves the next project code for the current year, e.g. PH-2026-0001. */
export async function nextProjectCode(): Promise<string> {
  const year = today().getUTCFullYear();
  const counter = await prisma.counter.upsert({
    where: { id: `project-${year}` },
    update: { value: { increment: 1 } },
    create: { id: `project-${year}`, value: 1 },
  });
  return formatProjectCode(year, counter.value);
}
