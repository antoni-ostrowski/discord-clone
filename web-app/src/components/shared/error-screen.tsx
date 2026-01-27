import { OctagonX, RotateCcw, TriangleAlert } from "lucide-react"
import { Button } from "../ui/button"

export default function FullScreenError({
  errorMessage = "Something went wrong.",
  errorDetail = "",
  actionButton,
  type = "error"
}: {
  errorMessage?: string
  errorDetail?: string
  actionButton?: React.ReactNode
  type?: "error" | "warning"
}) {
  return (
    <div className="flex h-full w-full flex-1 flex-col items-center justify-center gap-4">
      {type === "error" && <OctagonX className="text-destructive" size={100} />}
      {type === "warning" && (
        <TriangleAlert className="text-yellow-300" size={100} />
      )}
      <h1 className="text-3xl font-bold">{errorMessage}</h1>
      <p className="text-muted-foreground max-w-[50%] text-center text-sm">
        {errorDetail}
      </p>
      <div className="flex w-1/6 flex-col items-center justify-center gap-3">
        <Button
          className="w-full"
          variant={"outline"}
          onClick={() => {
            location.reload()
          }}
        >
          <RotateCcw /> {"Odśwież stronę"}
        </Button>
        {actionButton && (
          <div className="w-full [&_button]:w-full">{actionButton}</div>
        )}
      </div>
    </div>
  )
}
