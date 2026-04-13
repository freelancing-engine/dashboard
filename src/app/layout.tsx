import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import { A11yProvider } from "./components/accessibility-provider";
import AccessibilityToggle from "./components/accessibility-toggle";
import BackgroundWrapper from "./components/background-wrapper";
import CursorWrapper from "./components/cursor-wrapper";
import SmoothScroll from "./components/smooth-scroll";
import PageTransitionProvider from "./components/page-transition-provider";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Freelancing Engine — Dashboard",
  description: "Lead management dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${spaceGrotesk.variable} ${spaceMono.variable}`}
    >
      <body className="min-h-screen bg-[#0c0614] text-[#f0eeff] antialiased">
        <A11yProvider>
          <BackgroundWrapper />
          <CursorWrapper />
          <SmoothScroll>
            <PageTransitionProvider>{children}</PageTransitionProvider>
          </SmoothScroll>
          <AccessibilityToggle />
        </A11yProvider>
      </body>
    </html>
  );
}
