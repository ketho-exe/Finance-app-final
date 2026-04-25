import { PageHeader } from "@/components/page-header";
import { ProfileAuth } from "@/components/profile-auth";

export default function ProfilePage() {
  return (
    <>
      <PageHeader
        eyebrow="Profile"
        title="Supabase auth and profile"
        description="Sign in with a Supabase magic link and maintain a user profile that can own cards, pots, wishlist items, and transactions through RLS."
      />
      <ProfileAuth />
    </>
  );
}
