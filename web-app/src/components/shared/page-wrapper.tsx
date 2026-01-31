import { cn } from "@/lib/utils"
import { ComponentProps, ReactNode } from "react"

export default function PageWrapper({
  children,
  className
}: {
  children: ReactNode
  className?: ComponentProps<"div">["className"]
}) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-1 flex-col items-center justify-center",
        className
      )}
    >
      {children}
    </div>
  )
}
