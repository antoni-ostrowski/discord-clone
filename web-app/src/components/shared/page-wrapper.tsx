import { cn } from "@/lib/utils"
import { ComponentProps, ReactNode } from "react"

export default function PageWrapper({
  children,
  className
}: {
  children: ReactNode
  className?: ComponentProps<"div">
}) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-1 flex-col items-start justify-start",
        className
      )}
    >
      {children}
    </div>
  )
}
