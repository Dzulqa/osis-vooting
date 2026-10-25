import BoothGuard from "@/components/BoothGuard";
import VotingBooth from "@/components/VotingBooth";

export default async function BoothPage({ params }) {
  const { id } = await params;

  return (
    <BoothGuard boothId={id}>
      <VotingBooth boothId={id} />
    </BoothGuard>
  );
}
