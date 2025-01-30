import "./globals.css"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Join Our Exclusive Waitlist | Nawab & Co.",
  description:
    "By joining, you'll be the first to receive exclusive insight into our highly anticipated launch.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#B2A5FF]`}>
        {" "}
        {/* Light beige background */}
        <div className="fixed top-0 left-0 p-4 z-10">
          <h2 className="text-2xl font-bold text-gray-800">nawab & Co.</h2>
        </div>
        {children}
      </body>
    </html>
  );
}

