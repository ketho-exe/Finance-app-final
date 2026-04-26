import { PageHeader } from "@/components/page-header";
import { ProfileAuth } from "@/components/profile-auth";

export default function ProfilePage() {
  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Your profile"
        description="Manage your display name, currency preference, and account session."
      />
      <ProfileAuth />
    </>
  );
}
