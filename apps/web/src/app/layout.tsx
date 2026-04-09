import type { Metadata } from "next"
import { Chakra_Petch, Noto_Sans_SC, Russo_One } from "next/font/google"
import type { ReactNode } from "react"
import "./globals.css"

const bodyFont = Chakra_Petch({
  subsets: ["latin"],
  variable: "--font-body-latin",
  weight: ["300", "400", "500", "600", "700"],
})

const displayFont = Russo_One({
  subsets: ["latin"],
  variable: "--font-display-latin",
  weight: ["400"],
})

const cjkFont = Noto_Sans_SC({
  preload: false,
  variable: "--font-cjk",
  weight: ["300", "400", "500", "700"],
})

export const metadata: Metadata = {
  title: "WorldWeaver RPG / 世界织匠 RPG",
  description:
    "Interactive local control center for world drafting, session launch, and memory-aware chat workflows. 世界草稿、会话启动与记忆聊天的一体化本地控制台。",
}

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${bodyFont.variable} ${displayFont.variable} ${cjkFont.variable}`}
      >
        {children}
      </body>
    </html>
  )
}
