import type { Metadata } from "next";
import { Roboto_Mono, Inter, Space_Grotesk } from "next/font/google";
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

export const metadata: Metadata = {
  title: "DecayState",
  description: "Manifest your future or watch it fade.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${spaceGrotesk.variable}`}
    >
      <body
        className={`${robotoMono.variable} antialiased bg-black text-white min-h-screen`}
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
