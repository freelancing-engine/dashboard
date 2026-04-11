import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="es">
      <body className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)] antialiased">
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-[var(--color-primary-100)] opacity-40 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-[var(--color-primary-50)] opacity-30 blur-3xl" />
        </div>
        {children}
      </body>
    </html>
  );
}
