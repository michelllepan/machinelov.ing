import { Metadata } from "next";
import { redirect } from "next/navigation";
import valentines from "../../../../public/valentines.json";

interface Valentine {
  id: number;
  message: string;
}

const allSpicy = valentines.spicy as Valentine[];
const valentineMap = new Map(
  allSpicy.map((v) => [String(v.id), v])
);

export function generateStaticParams() {
  return allSpicy.map((v) => ({ id: String(v.id) }));
}

export function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  return params.then(({ id }) => {
    const v = valentineMap.get(id);
    if (!v) return {};
    return {
      title: "ml valentines (spicy)",
      description: v.message,
      openGraph: {
        title: "ml valentines (spicy)",
        description: v.message,
        images: [`/og/v-${v.id}.jpeg`],
      },
      twitter: {
        card: "summary_large_image",
        title: "ml valentines (spicy)",
        description: v.message,
        images: [`/og/v-${v.id}.jpeg`],
      },
    };
  });
}

export default async function SpicyValentinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/spicy?v=${id}`);
}
