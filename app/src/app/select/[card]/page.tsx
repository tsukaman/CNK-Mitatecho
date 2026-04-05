import SelectCardClient from "./SelectCardClient";
import { CARD_SLUG_MAP, resolveCardSlug } from "@/lib/tokens";

export function generateStaticParams() {
  return Object.keys(CARD_SLUG_MAP).map((slug) => ({ card: slug }));
}

interface Props {
  params: Promise<{ card: string }>;
}

export default async function SelectCardPage({ params }: Props) {
  const { card } = await params;
  const cardId = resolveCardSlug(card);

  if (!cardId) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-20 flex flex-col items-center gap-4 py-12">
        <p className="text-sm text-red-600">無効なカードです</p>
      </div>
    );
  }

  return <SelectCardClient cardId={cardId} />;
}
