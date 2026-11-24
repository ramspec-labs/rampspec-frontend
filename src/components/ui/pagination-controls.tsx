import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";

export interface PaginationControlsProps {
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  isLoading?: boolean;
  onPageChange?: (direction: "previous" | "next") => void;
}

export function PaginationControls({
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  isLoading = false,
}: PaginationControlsProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-line pt-6">
      <div className="text-sm text-muted">
        {!hasPrevious && !hasNext ? "No more pages" : ""}
      </div>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={onPrevious}
          disabled={!hasPrevious || isLoading}
          aria-label="Go to previous page"
        >
          <ChevronLeft size={16} />
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onNext}
          disabled={!hasNext || isLoading}
          aria-label="Go to next page"
        >
          Next
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}
