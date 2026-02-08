import type { Metadata } from "next";
import { Roboto_Mono } from "next/font/google"; // Import Roboto Mono
import "./globals.css";

const robotoMono = Roboto_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"], // Import necessary weights
});

export const metadata: Metadata = {
  title: "Switch Protocol",
  description: "Manifest your future or watch it fade.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${robotoMono.variable} antialiased bg-black text-white min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
