import { jsonOk, withErrorHandling } from "@/lib/api/http";
import { deleteSession } from "@/lib/auth/session";

export const POST = withErrorHandling(async () => {
  await deleteSession();
  return jsonOk({ loggedOut: true });
});
