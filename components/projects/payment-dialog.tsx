"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiClientError, apiFetch, getErrorMessage } from "@/lib/api-client";
import { roundMoney } from "@/lib/finance";
import { formatCurrency } from "@/lib/format";
import type { ProjectDTO } from "@/lib/types";

type PaymentProject = Pick<ProjectDTO, "id" | "clientPrice" | "advancePaid" | "paymentStatus">;

/** Dialog for updating how much the client has paid so far. */
export function PaymentDialog({ project }: { project: PaymentProject }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [refunded, setRefunded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function handleOpenChange(next: boolean) {
    if (pending) return;
    if (next) {
      setAmount(String(project.advancePaid));
      setRefunded(project.paymentStatus === "REFUNDED");
      setError(null);
    }
    setOpen(next);
  }

  const paid = amount.trim() === "" ? Number.NaN : Number(amount);
  const remaining = Number.isFinite(paid) ? roundMoney(Math.max(project.clientPrice - paid, 0)) : null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!Number.isFinite(paid)) return setError("Enter the amount paid");
    if (paid < 0) return setError("Paid amount cannot be negative");
    if (paid > project.clientPrice) {
      return setError(`Paid amount cannot exceed the client price (${formatCurrency(project.clientPrice)})`);
    }

    setError(null);
    setPending(true);
    try {
      await apiFetch<ProjectDTO>(`/api/projects/${project.id}`, {
        method: "PATCH",
        body: { advancePaid: paid, refunded },
      });
      toast.success("Payment updated");
      setOpen(false);
      router.refresh();
    } catch (caught) {
      if (caught instanceof ApiClientError && caught.fieldErrors.advancePaid) {
        setError(caught.fieldErrors.advancePaid);
      } else {
        toast.error(getErrorMessage(caught));
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <CreditCard />
          Update payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
          <DialogHeader>
            <DialogTitle>Update payment</DialogTitle>
            <DialogDescription>
              Enter the total amount the client has paid so far. The client price is{" "}
              {formatCurrency(project.clientPrice)}.
            </DialogDescription>
          </DialogHeader>

          <FormField
            label="Total paid by client (Rs.)"
            htmlFor="payment-amount"
            error={error ?? undefined}
            hint={remaining === null ? undefined : `Remaining after this: ${formatCurrency(remaining)}`}
          >
            <div className="flex gap-2">
              <Input
                id="payment-amount"
                type="number"
                inputMode="decimal"
                min={0}
                max={project.clientPrice}
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                aria-invalid={Boolean(error) || undefined}
              />
              <Button type="button" variant="outline" onClick={() => setAmount(String(project.clientPrice))}>
                Paid in full
              </Button>
            </div>
          </FormField>

          <div className="flex items-center gap-2">
            <Checkbox
              id="payment-refunded"
              checked={refunded}
              onCheckedChange={(checked) => setRefunded(checked === true)}
            />
            <Label htmlFor="payment-refunded" className="font-normal">
              The payment was refunded to the client
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <LoaderCircle className="animate-spin" />}
              Save payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
