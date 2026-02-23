import SelectCardClient from "./SelectCardClient";

export function generateStaticParams() {
  return [
    { card: "1" },
    { card: "2" },
    { card: "3" },
    { card: "4" },
    { card: "5" },
    { card: "6" },
  ];
}

interface Props {
  params: Promise<{ card: string }>;
}

export default async function SelectCardPage({ params }: Props) {
  const { card } = await params;
  const cardId = parseInt(card, 10);

  if (cardId < 1 || cardId > 6) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-sm text-red-600">無効なカードです</p>
      </div>
    );
  }

  return <SelectCardClient cardId={cardId} />;
}
