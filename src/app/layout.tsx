import type { Metadata } from "next";
import { CartProvider } from "@/components/CartContext";
import { Geist, Geist_Mono } from "next/font/google";
import './globals.css'


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CrashCart",
   icons: {
    icon: "/logo.png",
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <CartProvider>
          {children}
        </CartProvider>
        </body>
      </html>
  );
}
