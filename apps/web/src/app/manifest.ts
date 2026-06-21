import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Copilot Exposure Lab",
    short_name: "Exposure Lab",
    description:
      "Test whether Microsoft 365 Copilot, agents, and SharePoint/OneDrive permissions could expose sensitive data.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbfbf9",
    theme_color: "#4733b8",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
