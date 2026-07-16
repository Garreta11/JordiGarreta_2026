import type { Metadata } from "next";
import { client } from "@/sanity/lib/client";
import { descriptionQueries } from "@/lib/queries/description.queries";
import { portableTextToPlainText, SITE_TITLE, SITE_DESCRIPTION } from "@/lib/seo";
import HomeClient from "./HomeClient";
import type { PortableTextBlock } from "@portabletext/types";

export async function generateMetadata(): Promise<Metadata> {
  const data = await client.fetch(descriptionQueries.description);
  const description = portableTextToPlainText(data?.description as PortableTextBlock[]) || SITE_DESCRIPTION;

  return {
    title: { absolute: SITE_TITLE },
    description,
    alternates: { canonical: "/" },
    openGraph: { title: SITE_TITLE, description, url: "/" },
    twitter: { title: SITE_TITLE, description },
  };
}

export default function Home() {
  return <HomeClient />;
}
