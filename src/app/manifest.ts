import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bistrava",
    short_name: "Bistrava",
    description: "Čista voda. Pametna izbira.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8FCFC",
    theme_color: "#10324A",
    lang: "sl-SI",
    icons: [
      {
        src: "/icon.png",
        sizes: "1774x887",
        type: "image/png",
      },
    ],
  };
}
