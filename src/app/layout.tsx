import type { Metadata } from "next";
import { Anton, Instrument_Serif, IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
  display: "swap",
});

/* editorial mono - credits, badges, chrome labels (gig-poster voice) */
const plex = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
