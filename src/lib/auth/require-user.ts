import { createClient } from "@/lib/supabase-server";

export async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return {
      supabase,
      user: null,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { supabase, user: data.user, response: null };
}
