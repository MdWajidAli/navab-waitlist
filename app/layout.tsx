import "./globals.css";
import { Inter } from "next/font/google";
import type React from "react"; // Import React

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Join Our Exclusive Waitlist | nawab & Co.",
  description:
    "Be the first to experience our revolutionary clothing designs. Sign up for exclusive early access and offers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#F5F5DC]`}>{children}</body>
    </html>
  );
}
