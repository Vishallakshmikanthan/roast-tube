import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { BrandShell } from "@/components/BrandShell";

export const metadata: Metadata = {
  metadataBase: new URL("https://roasttube.vercel.app"),
  title: "RoastTube - How cooked is your YouTube?",
  description:
    "Sign in with Google. We read your liked videos, subscriptions and playlists (read-only) and an AI roasts your taste ruthlessly.",
  applicationName: "RoastTube",
  authors: [{ name: "Vishallakshmikanthan" }],
  keywords: [
    "YouTube roast",
    "Brainrot score",
    "AI roast",
    "YouTube taste analyzer",
    "RoastTube",
  ],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "RoastTube - How cooked is your YouTube?",
    description:
      "Sign in with Google. We read your liked videos, subscriptions and playlists (read-only) and an AI roasts your taste ruthlessly.",
    url: "https://roasttube.vercel.app",
    siteName: "RoastTube",
    images: [
      {
        url: "/images/pixel-cat-cutout.webp",
        width: 1200,
        height: 630,
        alt: "RoastTube - AI YouTube Taste Roaster",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RoastTube - How cooked is your YouTube?",
    description:
      "Sign in with Google. We read your liked videos, subscriptions and playlists (read-only) and an AI roasts your taste ruthlessly.",
    images: ["/images/pixel-cat-cutout.webp"],
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
