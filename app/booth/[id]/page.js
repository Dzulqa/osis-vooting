import VotingBooth from "@/components/VotingBooth";

export default async function BoothPage({ params }) {
  const { id } = await params;

  return <VotingBooth boothId={id} />;
}