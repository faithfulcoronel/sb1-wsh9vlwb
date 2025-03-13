import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';
import { Select } from './Select';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  totalItems: number;
  showItemsPerPage?: boolean;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'simple' | 'outline' | 'pills';
}

const itemsPerPageOptions = [10, 25, 50, 100];

const sizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base'
};

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
  showItemsPerPage = true,
  onItemsPerPageChange,
  className = '',
  size = 'md',
  variant = 'outline'
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    const halfMaxPages = Math.floor(maxPagesToShow / 2);

    let startPage = Math.max(currentPage - halfMaxPages, 1);
    let endPage = Math.min(startPage + maxPagesToShow - 1, totalPages);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(endPage - maxPagesToShow + 1, 1);
    }

    // Always show first page
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) pages.push('...');
    }

    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Always show last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  const renderPageButton = (page: number | string, index: number) => {
    if (typeof page === 'string') {
      return (
        <span key={`ellipsis-${index}`} className="px-4 py-2 text-gray-700 dark:text-gray-300">
          {page}
        </span>
      );
    }

    return (
      <Button
        key={page}
        variant={page === currentPage ? 'primary' : 'outline'}
        size={size}
        onClick={() => onPageChange(page)}
        className={`
          ${variant === 'pills' ? 'rounded-full' : ''}
          ${variant === 'simple' ? 'border-0 shadow-none' : ''}
          ${page === currentPage
            ? 'z-10'
            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
          }
        `}
      >
        {page}
      </Button>
    );
  };

  return (
    <div className={`
      flex flex-col sm:flex-row items-center justify-between
      bg-white dark:bg-gray-900
      px-4 py-3 sm:px-6
      ${variant !== 'simple' && 'border-t border-gray-200 dark:border-gray-700'}
      ${sizeClasses[size]}
      ${className}
    `}>
      {/* Mobile pagination */}
      <div className="flex flex-1 justify-between sm:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={variant === 'pills' ? 'rounded-full' : ''}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={variant === 'pills' ? 'rounded-full' : ''}
        >
          Next
        </Button>
      </div>

      {/* Desktop pagination */}
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-gray-700 dark:text-gray-300">
            Showing <span className="font-medium">{startItem}</span> to{' '}
            <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{totalItems}</span> results
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {showItemsPerPage && onItemsPerPageChange && (
            <div className="flex items-center space-x-2">
              <label htmlFor="itemsPerPage" className="text-gray-700 dark:text-gray-300">
                Show:
              </label>
              <Select
                id="itemsPerPage"
                value={itemsPerPage.toString()}
                onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                options={itemsPerPageOptions.map(option => ({
                  value: option.toString(),
                  label: option.toString()
                }))}
                size={size}
                className="w-20"
              />
            </div>
          )}

          <nav className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <Button
              variant="outline"
              size={size}
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`rounded-l-md ${variant === 'pills' ? 'rounded-full' : ''}`}
              icon={<ChevronLeft className="h-4 w-4" />}
              aria-label="Previous page"
            />

            <div className="hidden md:flex">
              {getPageNumbers().map((page, index) => renderPageButton(page, index))}
            </div>

            <Button
              variant="outline"
              size={size}
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`rounded-r-md ${variant === 'pills' ? 'rounded-full' : ''}`}
              icon={<ChevronRight className="h-4 w-4" />}
              aria-label="Next page"
            />
          </nav>
        </div>
      </div>
    </div>
  );
}