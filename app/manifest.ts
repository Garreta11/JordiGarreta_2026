import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: "Creative developer portfolio — from web interfaces to physical and generative environments",
    start_url: "/",
    display: "standalone",
    background_color: "#F4F4F6",
    theme_color: "#202123",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
