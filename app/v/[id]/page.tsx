import { Metadata } from "next";
import { redirect } from "next/navigation";
import valentines from "../../../public/valentines.json";

interface Valentine {
  id: number;
  message: string;
}

const valentineMap = new Map(
  (valentines as Valentine[]).map((v) => [String(v.id), v])
);

export function generateStaticParams() {
  return (valentines as Valentine[]).map((v) => ({ id: String(v.id) }));
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
      title: "ml valentines",
      description: v.message,
      openGraph: {
        title: "ml valentines",
        description: v.message,
        images: [`/og/v-${v.id}.jpeg`],
      },
      twitter: {
        card: "summary_large_image",
        title: "ml valentines",
        description: v.message,
        images: [`/og/v-${v.id}.jpeg`],
      },
    };
  });
}

export default async function ValentinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/?v=${id}`);
}
