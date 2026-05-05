import { requireUser } from "@/lib/auth/require-user";

export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (response) return response;

  const appUrl = process.env.APP_URL ?? new URL(request.url).origin;
  const result = await fetch(`${appUrl}/api/open-banking/sync-user?user_id=${user!.id}`, {
    headers: {
      authorization: `Bearer ${process.env.CRON_SECRET}`,
    },
  });

  return Response.json(await result.json(), { status: result.status });
}
