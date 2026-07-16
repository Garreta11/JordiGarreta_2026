import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/seo";

export const alt = "Jordi Garreta — Creative Developer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          backgroundColor: "#202123",
          color: "#F4F4F6",
          padding: "90px",
          fontFamily: "monospace",
        }}
      >
        <div style={{ fontSize: 68, fontWeight: 600, letterSpacing: -1 }}>{SITE_NAME}</div>
        <div style={{ fontSize: 32, marginTop: 28, color: "#9a9a9e" }}>
          Creative Developer — Barcelona
        </div>
      </div>
    ),
    { ...size }
  );
}
