import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const anton = localFont({
  src: "./fonts/Anton-400.woff2",
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

const instrument = localFont({
  src: [
    { path: "./fonts/InstrumentSerif-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/InstrumentSerif-400-italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-instrument",
  display: "swap",
});

const grotesk = localFont({
  src: "./fonts/SpaceGrotesk-300-700.woff2",
  weight: "300 700",
  variable: "--font-grotesk",
  display: "swap",
});

/* editorial mono - credits, badges, chrome labels (gig-poster voice) */
const plex = localFont({
  src: [
    { path: "./fonts/IBMPlexMono-400.woff2", weight: "400" },
    { path: "./fonts/IBMPlexMono-500.woff2", weight: "500" },
    { path: "./fonts/IBMPlexMono-600.woff2", weight: "600" },
  ],
  variable: "--font-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SWAG DAY FS — Stage Production System",
  description:
    "Full-stack stage production system for school events. Theme: Suit up! Show up! Sport it up! — Teachers' Day '26.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${anton.variable} ${instrument.variable} ${grotesk.variable} ${plex.variable}`}>
      <body>{children}</body>
    </html>
  );
}
