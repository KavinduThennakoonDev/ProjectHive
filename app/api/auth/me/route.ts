import { jsonOk, withAuth } from "@/lib/api/http";

export const GET = withAuth(async (_request, _context, admin) => jsonOk({ admin }));
