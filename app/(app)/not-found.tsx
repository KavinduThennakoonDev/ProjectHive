import Link from "next/link";
import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="rounded-xl border bg-card">
      <EmptyState
        icon={SearchX}
        title="Not found"
        description="This record does not exist. It may have been deleted."
        action={
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        }
      />
    </div>
  );
}
