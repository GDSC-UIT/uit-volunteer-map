import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface ErrorMessageProps {
  /** Error message to display */
  message?: string;
  /** Callback for the retry button */
  onRetry?: () => void;
}

/**
 * Reusable error state component.
 * Shows a friendly error message with an optional retry button.
 * Never exposes stack traces or technical details.
 */
export default function ErrorMessage({
  message = "Đã xảy ra lỗi. Vui lòng thử lại.",
  onRetry,
}: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
        <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
      </div>

      <h3 className="text-lg font-semibold text-gray-800 mb-1">
        Không thể tải dữ liệu
      </h3>

      <p className="text-sm text-gray-500 text-center max-w-sm mb-5">
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="px-5 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors duration-200 cursor-pointer"
        >
          Thử lại
        </button>
      )}
    </div>
  );
}
