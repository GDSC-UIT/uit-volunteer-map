import { InboxIcon } from "@heroicons/react/24/outline";

interface EmptyStateProps {
  /** Main title text */
  title: string;
  /** Optional description below the title */
  description?: string;
}

/**
 * Reusable empty state component.
 * Shown when an API returns successfully but the list is empty.
 */
export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
        <InboxIcon className="w-8 h-8 text-gray-400" />
      </div>

      <h3 className="text-lg font-semibold text-gray-700 mb-1">{title}</h3>

      {description && (
        <p className="text-sm text-gray-400 text-center max-w-sm">
          {description}
        </p>
      )}
    </div>
  );
}
