
export const KpiCardSkeleton = () => (
  <div
    className="flex animate-pulse items-center space-x-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-md"
    role="status"
    aria-label="Loading metric"
  >
    <div className="h-12 w-12 rounded-xl bg-gray-100" />
    <div className="flex-1 space-y-2">
      <div className="h-3 w-20 rounded bg-gray-100" />
      <div className="h-5 w-14 rounded bg-gray-100" />
    </div>
  </div>
);

export const TableRowsSkeleton = ({ rows = 5, columns = 5 }) => (
  <>
    {Array.from({ length: rows }).map((_, r) => (
      <tr key={r} className="animate-pulse">
        {Array.from({ length: columns }).map((__, c) => (
          <td key={c} className="table-cell">
            <div className="h-3 w-full max-w-[120px] rounded bg-gray-100" />
          </td>
        ))}
      </tr>
    ))}
  </>
);
