import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BETdoBEM",
    short_name: "BETdoBEM",
    description: "Proteja sua banca de BENS, com reset de patrimônio a cada semana e odds atualizadas!",
    start_url: "/?origem=pwa",
    scope: "/",
    display: "standalone",
    lang: "pt-BR",
    background_color: "#0b0b0b",
    theme_color: "#0b0b0b",
    icons: [
      { src: "/icons/icon-192.png?v=2", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png?v=2", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-192.png?v=2", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png?v=2", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    related_applications: [{ platform: "webapp", url: "https://betdobem.vercel.app/manifest.webmanifest" }],
    prefer_related_applications: false,
  };
}
