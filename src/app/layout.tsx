import type { Metadata } from "next";
import "./globals.css";
import { Inter, Playfair_Display } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/context/LanguageContext";
import { CurrencyProvider } from "@/components/CurrencyContext";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Arenguade Paper Product — Sustainable Packaging & Craft Academy",
  description:
    "Addis Ababa's premier manufacturer of 100% biodegradable artisan kraft bags and vocational paper-making academy. Browse our portfolio and commission your own custom packaging.",
  keywords:
    "Ethiopian packaging, kraft bags, paper bags, Addis Ababa, sustainable packaging, custom printing, eco packaging",
  openGraph: {
    title: "Arenguade Paper Product — Sustainable Packaging",
    description:
      "100% biodegradable artisan kraft bags manufactured in Addis Ababa. Custom branding, wholesale orders.",
    type: "website",
    locale: "en_ET",
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
      className={`h-full antialiased ${inter.variable} ${playfair.variable}`}
    >
      <body className="min-h-full flex flex-col font-sans text-stone-900 bg-[#F9F6F0]">
        <LanguageProvider>
          <CurrencyProvider>
            <CartProvider>
              <Navbar />
              <CartDrawer />
              <main className="flex-1">{children}</main>
              <Footer />
            </CartProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
