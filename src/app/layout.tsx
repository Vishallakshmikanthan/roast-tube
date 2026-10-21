import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { BrandShell } from "@/components/BrandShell";

export const metadata: Metadata = {
  title: "RoastTube - How cooked is your YouTube?",
  description:
    "Sign in with Google. We read your liked videos, subscriptions and playlists (read-only) and an AI roasts your taste ruthlessly.",
  icons: {
    icon: "/favicon.svg",
  },
  verification: {
    google: "nHkWfGSF0PKxzMs1c0zOEL8uOGF_t-F8Pj_VuT5jUsA",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <BrandShell>{children}</BrandShell>
        </AuthProvider>
      </body>
    </html>
  );
}
