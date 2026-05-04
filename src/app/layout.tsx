import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SubTrack — Academic Tracker",
  description: "Collaborative academic tracker for 3 friends. Track assignments, exams, attendance, and study resources together.",
  keywords: ["academic tracker", "assignments", "study", "attendance", "exams"],
  authors: [{ name: "SubTrack" }],
  openGraph: {
    title: "SubTrack — Academic Tracker",
    description: "Track your studies together, transparently.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
