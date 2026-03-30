export default function Loading() {
  return (
    <div className="px-4 py-5 space-y-4 animate-pulse">
      
      {/* Header */}
      <div className="h-6 w-40 bg-[#2e2e2e] rounded" />
      <div className="h-4 w-32 bg-[#2e2e2e] rounded" />

      {/* Cards */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="h-20 bg-[#2e2e2e] rounded-xl" />
        <div className="h-20 bg-[#2e2e2e] rounded-xl" />
        <div className="h-20 bg-[#2e2e2e] rounded-xl" />
      </div>

      {/* List */}
      <div className="space-y-3 mt-4">
        <div className="h-12 bg-[#2e2e2e] rounded" />
        <div className="h-12 bg-[#2e2e2e] rounded" />
        <div className="h-12 bg-[#2e2e2e] rounded" />
      </div>

    </div>
  )
}