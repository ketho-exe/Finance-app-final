import { PageHeader } from "@/components/page-header";
import { WishlistManager } from "@/components/wishlist-manager";

export default function WishlistPage() {
  return (
    <>
      <PageHeader
        eyebrow="Wishlist"
        title="Plan wants without wrecking needs"
        description="Keep nice-to-have spending visible, prioritised, and connected to your savings progress."
      />
      <WishlistManager />
    </>
  );
}
