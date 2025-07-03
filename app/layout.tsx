import type { Metadata } from "next";
import {Outfit} from "next/font/google";

const outfit = Outfit({
  subsets: ['latin'], // Specify the subsets you need
  display: 'swap',   // Controls font loading behavior (optional, but 'swap' is common)
  // You can also specify weights if it's not a variable font, e.g., weight: ['400', '700']
});

import "./globals.css";
import {
  ClerkProvider,

} from '@clerk/nextjs'



export const metadata: Metadata = {
  title: "DocRevive",
  description: "Convert your documents with ease using DocRevive",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={outfit.className}>

          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
