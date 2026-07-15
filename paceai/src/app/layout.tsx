import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "PaceAI — Tu entrenador de running con IA",
    template: "%s · PaceAI",
  },
  description:
    "PaceAI no registra tus entrenamientos: los interpreta. Análisis con IA, predicciones de marca, detección de errores y un entrenador disponible 24 horas.",
  keywords: ["running", "entrenador IA", "análisis entrenamientos", "predicción 10K", "VO2max"],
  applicationName: "PaceAI",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "PaceAI — Tu entrenador de running con IA",
    description: "El analista inteligente de rendimiento para corredores.",
    type: "website",
    locale: "es_ES",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0d",
  width: "device-width",
  initialScale: 1,
};

// Applies the persisted theme before first paint to avoid a flash.
const themeScript = `try{var t=localStorage.getItem("paceai-theme");document.documentElement.dataset.theme=t==="light"?"light":"dark"}catch(e){document.documentElement.dataset.theme="dark"}`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
