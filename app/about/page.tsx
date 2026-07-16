import type { Metadata } from "next";
import { client } from "@/sanity/lib/client";
import { aboutQueries } from "@/lib/queries/about.queries";
import { About } from "@/lib/types";
import { portableTextToPlainText, SITE_NAME, SITE_URL } from "@/lib/seo";
import AboutClient from "./AboutClient";

export async function generateMetadata(): Promise<Metadata> {
  const about: About | null = await client.fetch(aboutQueries.all);
  const description =
    portableTextToPlainText(about?.description) ||
    "About Jordi Garreta — creative developer based in Barcelona, tools, clients and how to get in touch.";

  return {
    title: "About",
    description,
    alternates: { canonical: "/about" },
    openGraph: { title: "About", description, url: "/about" },
    twitter: { title: "About", description },
  };
}

export default async function AboutPage() {
  const about: About | null = await client.fetch(aboutQueries.all);

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: SITE_NAME,
    url: SITE_URL,
    jobTitle: "Creative Developer",
    email: about?.email ? `mailto:${about.email}` : undefined,
    sameAs: about?.social?.map((s) => s.url).filter(Boolean),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <AboutClient />
    </>
  );
}
