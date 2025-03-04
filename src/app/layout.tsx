import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GetSmart",
  description: "A smarter way to learn",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}