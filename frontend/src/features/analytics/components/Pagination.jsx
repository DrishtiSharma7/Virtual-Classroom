
const Pagination = ({ page, limit, total, onPageChange }) => {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  if (totalPages <= 1) return null;

  return (
    <div className="analytics-pagination">
      <span>
        Page {page} of {totalPages} ({total} total)
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          className="analytics-pagination-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          data-tooltip="Previous"
          title="Previous"
        >
          Previous
        </button>
        <button
          type="button"
          className="analytics-pagination-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          data-tooltip="Next"
          title="Next"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
