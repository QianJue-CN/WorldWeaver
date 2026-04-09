"use client"

import { layoutWithLines, prepareWithSegments } from "@chenglou/pretext"
import { useEffect, useRef, useState } from "react"

const font = '500 16px "Chakra Petch"'
const lineHeight = 30

type StreamLine = {
  key: string
  text: string
}

export function PretextStreamText({
  text,
}: Readonly<{
  text: string
}>) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(0)
  const [prepared, setPrepared] = useState(() =>
    prepareWithSegments(text, font),
  )
  const [lines, setLines] = useState<StreamLine[]>(() =>
    text ? [{ key: "fallback-0", text }] : [],
  )
  const [visibleLines, setVisibleLines] = useState(0)

  useEffect(() => {
    setPrepared(prepareWithSegments(text, font))
  }, [text])

  useEffect(() => {
    const node = containerRef.current

    if (!node) {
      return
    }

    const observer = new ResizeObserver((entries) => {
      const nextWidth = Math.floor(entries[0]?.contentRect.width ?? 0)

      setWidth(nextWidth > 0 ? nextWidth : 0)
    })

    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    if (width < 1) {
      setLines(text ? [{ key: "fallback-0", text }] : [])
      return
    }

    const nextLines = layoutWithLines(prepared, width, lineHeight).lines.map(
      (line) => ({
        key: `${line.start.segmentIndex}:${line.start.graphemeIndex}-${line.end.segmentIndex}:${line.end.graphemeIndex}`,
        text: line.text,
      }),
    )

    setLines(
      nextLines.length > 0 ? nextLines : [{ key: "fallback-0", text: "" }],
    )
  }, [prepared, text, width])

  useEffect(() => {
    setVisibleLines(0)

    if (lines.length === 0) {
      return
    }

    const timer = window.setInterval(() => {
      setVisibleLines((current) => {
        if (current >= lines.length) {
          window.clearInterval(timer)
          return current
        }

        return current + 1
      })
    }, 75)

    return () => {
      window.clearInterval(timer)
    }
  }, [lines])

  return (
    <div className="pretext-stream" ref={containerRef}>
      {lines.map((line, index) => (
        <span
          className={`pretext-line${
            index < visibleLines ? " pretext-line-visible" : ""
          }`}
          key={line.key}
        >
          {line.text || "\u00A0"}
        </span>
      ))}
    </div>
  )
}
