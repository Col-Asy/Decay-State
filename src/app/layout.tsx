import type { Metadata } from "next";
import { Roboto_Mono, Inter, Space_Grotesk, Architects_Daughter } from "next/font/google";
import "./globals.css";
import { GlobalSearch } from "@/components/GlobalSearch";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/ui/CyberToast";

const robotoMono = Roboto_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-display",
});

const architectsDaughter = Architects_Daughter({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-handwritten",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.decaystate.com"),
  title: "DecayState",
  description:
    "Manifest your future or watch it fade. Execute 80% of your daily protocol, or physically watch your ambition decay. Strict AI. No Excuses.",
  keywords: [
    "accountability",
    "AI",
    "goal tracking",
    "productivity",
    "decay state",
    "execute or decay",
  ],
  authors: [{ name: "DecayState" }],
  openGraph: {
    title: "DecayState — Execute or Decay",
    description:
      "Manifest your future or watch it fade. Execute 80% of your daily protocol, or physically watch your ambition decay. Strict AI. No Excuses.",
    url: "/",
    siteName: "DecayState",
    images: [
      {
        url: "/decaystate-banner.png",
        width: 1836,
        height: 927,
        alt: "DecayState — Execute or Decay",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DecayState — Execute or Decay",
    description:
      "Manifest your future or watch it fade. Strict AI. No Excuses.",
    images: ["/decaystate-banner.png"],
    creator: "@decaystate",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${spaceGrotesk.variable} ${architectsDaughter.variable}`}
    >
      <body
        className={`${robotoMono.variable} ${architectsDaughter.variable} antialiased bg-black text-white min-h-screen`}
      >
        <AuthProvider>
          <ToastProvider>
            {children}
            <GlobalSearch />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
