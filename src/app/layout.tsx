import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CollabCanvas - Collaborative Design with AI",
  description: "Real-time collaborative canvas powered by AI. Create, design, and collaborate together.",
  keywords: ["canvas", "collaboration", "design", "AI", "real-time"],
  authors: [{ name: "CollabCanvas" }],
  openGraph: {
    title: "CollabCanvas - Collaborative Design with AI",
    description: "Real-time collaborative canvas powered by AI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
