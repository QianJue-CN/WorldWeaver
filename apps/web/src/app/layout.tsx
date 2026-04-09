import type { Metadata } from "next"
import { Chakra_Petch, Russo_One } from "next/font/google"
import type { ReactNode } from "react"
import "./globals.css"

const bodyFont = Chakra_Petch({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600", "700"],
})

const displayFont = Russo_One({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400"],
})

export const metadata: Metadata = {
  title: "WorldWeaver RPG",
  description:
    "Interactive local control center for world drafting, session launch, and memory-aware chat workflows.",
}

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        {children}
      </body>
    </html>
  )
}
