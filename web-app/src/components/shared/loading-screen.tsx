import { Spinner } from "../ui/spinner"

export default function FullScreenLoading({
  loadingMessage = "",
  loadingDetail = ""
}: {
  loadingMessage?: string
  loadingDetail?: string
}) {
  return (
    <div className="flex h-full w-full flex-1 flex-col items-center justify-center gap-4">
      <Spinner />
      <h1 className="text-3xl font-bold">{loadingMessage}</h1>
      <p className="max-w-[50%] text-center text-sm">{loadingDetail}</p>
      <div className="flex flex-col items-center justify-center gap-3"></div>
    </div>
  )
}
