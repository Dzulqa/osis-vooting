import BoothGuard from "@/components/BoothGuard";
import VotingBooth from "@/components/VotingBooth";
import Toaster from "@/components/Toaster";

export default async function BoothPage({ params }) {
  const { id } = await params;

  return (
    <BoothGuard boothId={id}>
      <VotingBooth boothId={id} />
      <Toaster />
    </BoothGuard>
  );
}
