import { jsonOk, withAuth } from "@/lib/api/http";
import { getDashboard } from "@/lib/services/dashboard";

export const GET = withAuth(async () => jsonOk(await getDashboard()));
