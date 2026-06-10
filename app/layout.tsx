import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LinkNest",
  description: "A modern link management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
