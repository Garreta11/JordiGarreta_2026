import type { Metadata } from "next";
import LabClient from "./LabClient";

const description =
  "Experiments and prototypes by Jordi Garreta — WebGL, Three.js and interaction design sketches.";

export const metadata: Metadata = {
  title: "Lab",
  description,
  alternates: { canonical: "/lab" },
  openGraph: { title: "Lab", description, url: "/lab" },
  twitter: { title: "Lab", description },
};

export default function LabPage() {
  return <LabClient />;
}
