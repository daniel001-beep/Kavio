import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kavio - Freelance Finance OS",
    short_name: "Kavio",
    description: "Business Finance Operating System for Nigerian Freelancers",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0c1329",
    theme_color: "#635BFF",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
