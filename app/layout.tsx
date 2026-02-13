import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://machinelov.ing"),
  title: "ml valentines",
  description: "machine learning is a love language too",
  openGraph: {
    title: "ml valentines",
    description: "machine learning is a love language too",
    images: [
      {
        url: "/og/base.jpeg",
        width: 1200,
        height: 630,
        alt: "ml valentines",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ml valentines",
    description: "machine learning is a love language too",
    images: ["/og/base.jpeg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={jetbrainsMono.className}>{children}</body>
    </html>
  );
}
