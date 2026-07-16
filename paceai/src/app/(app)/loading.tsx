/** Skeleton shown while server components fetch the user's data. */
export default function Loading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy>
      <div className="h-6 w-48 rounded-lg bg-hover" />
      <div className="h-4 w-72 rounded-lg bg-hover" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="card h-80 lg:col-span-3" />
        <div className="card h-80 lg:col-span-2" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card h-56" />
        <div className="card h-56" />
      </div>
    </div>
  );
}
