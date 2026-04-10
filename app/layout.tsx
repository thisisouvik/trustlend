import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

export const metadata: Metadata = {
  title: "TrustLend — Reputation-Based Micro-Lending for Everyone",
  description:
    "TrustLend is a decentralized micro-lending marketplace that empowers unbanked gig workers and freelancers in emerging markets to access credit based on real financial behavior — not collateral or credit history.",
  keywords: [
    "TrustLend",
    "micro-lending",
    "DeFi",
    "blockchain",
    "Stellar",
    "reputation score",
    "unbanked",
    "gig economy",
    "crypto lending",
  ],
  authors: [{ name: "TrustLend" }],
  openGraph: {
    title: "TrustLend — Reputation-Based Micro-Lending",
    description:
      "Access credit based on real financial behavior. 1.7 billion unbanked adults deserve better.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${manrope.variable} ${sora.variable} flex min-h-full flex-col antialiased`}>
        {children}
      </body>
    </html>
  );
}
