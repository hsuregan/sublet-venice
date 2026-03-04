import type { Metadata } from "next";
import { Playfair_Display, Lato } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const blisey = localFont({
  src: "../../public/fonts/blisey.otf",
  variable: "--font-blisey",
  display: "swap",
});

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Venice Beach Apartment | Book Direct & Save",
  description:
    "Cozy 1BR apartment in Venice Beach, LA. Steps from the boardwalk, Abbot Kinney, and the beach. Book direct — no service fees.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${lato.variable} ${blisey.variable} font-body antialiased`}>
        {children}
      </body>
    </html>
  );
}
