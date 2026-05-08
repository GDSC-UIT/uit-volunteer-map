interface LoadingSpinnerProps {
  /** Spinner size in pixels */
  size?: number;
  /** If true, centers the spinner in a full-page container */
  fullPage?: boolean;
}

/**
 * Reusable loading spinner with two variants:
 * - `fullPage`: centered vertically + horizontally in the viewport
 * - inline: for use inside a list/section
 */
export default function LoadingSpinner({
  size = 40,
  fullPage = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <svg
        className="animate-spin text-primary-500"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.963 7.963 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="text-sm text-gray-500 font-medium">Đang tải...</span>
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-16">{spinner}</div>
  );
}
