import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PaceAI — Entrenador de running con IA",
    short_name: "PaceAI",
    description:
      "El analista inteligente de rendimiento para corredores: interpreta tus entrenamientos, predice tus marcas y te dice qué hacer mañana.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0b0b0d",
    theme_color: "#0b0b0d",
    lang: "es",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
