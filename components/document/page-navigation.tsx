"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { handlePageChange } from "@/actions/page-navigation-actions";

interface PageNavigationProps {
  currentPage: number;
  totalPages: number;
  onPageChangeAction?: typeof handlePageChange;
}

export function PageNavigation({
  currentPage,
  totalPages,
  onPageChangeAction = handlePageChange,
}: PageNavigationProps) {
  const [inputPage, setInputPage] = useState(currentPage.toString());

  const handlePrevious = async () => {
    if (currentPage > 1) {
      await onPageChangeAction(currentPage - 1);
      setInputPage((currentPage - 1).toString());
    }
  };

  const handleNext = async () => {
    if (currentPage < totalPages) {
      await onPageChangeAction(currentPage + 1);
      setInputPage((currentPage + 1).toString());
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputPage(e.target.value);
  };

  const handleInputBlur = async () => {
    const pageNumber = parseInt(inputPage);
    if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
      await onPageChangeAction(pageNumber);
    } else {
      setInputPage(currentPage.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleInputBlur();
    }
  };

  return (
    <div className="flex items-center justify-center space-x-2 py-4">
      <Button
        variant="outline"
        size="icon"
        onClick={handlePrevious}
        disabled={currentPage <= 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center space-x-2">
        <Input
          className="w-14 text-center"
          value={inputPage}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          aria-label="Current page"
        />
        <span className="text-sm text-muted-foreground">of {totalPages}</span>
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={handleNext}
        disabled={currentPage >= totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
