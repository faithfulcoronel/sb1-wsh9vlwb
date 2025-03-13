import * as React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Select } from './select';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  totalItems?: number;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  showItemsPerPage?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'simple' | 'outline' | 'pills';
}

const itemsPerPageOptions = [10, 25, 50, 100];

const Pagination = React.forwardRef<HTMLDivElement, PaginationProps>(
  ({ 
    currentPage, 
    totalPages, 
    onPageChange, 
    itemsPerPage = 10,
    totalItems = 0,
    onItemsPerPageChange,
    showItemsPerPage = true,
    className,
    size = 'md',
    variant = 'outline'
  }, ref) => {
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

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col sm:flex-row items-center justify-between',
          'bg-background px-4 py-3 sm:px-6',
          variant !== 'simple' && 'border-t',
          className
        )}
      >
        <div className="flex-1 text-sm text-muted-foreground">
          {totalItems > 0 && (
            <p>
              Showing <span className="font-medium">{startItem}</span> to{' '}
              <span className="font-medium">{endItem}</span> of{' '}
              <span className="font-medium">{totalItems}</span> results
            </p>
          )}
        </div>

        <div className="flex items-center space-x-6 mt-4 sm:mt-0">
          {/* Items per page selector */}
          {showItemsPerPage && onItemsPerPageChange && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Show:</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => onItemsPerPageChange(Number(value))}
                options={itemsPerPageOptions.map(option => ({
                  value: option.toString(),
                  label: option.toString()
                }))}
                size={size}
                className="w-20"
              />
            </div>
          )}

          {/* Pagination controls */}
          <nav className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm">
            <Button
              variant="outline"
              size={size}
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              className={cn(
                'rounded-l-md',
                variant === 'pills' && 'rounded-full'
              )}
            >
              <span className="sr-only">First page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size={size}
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <span className="sr-only">Previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="hidden md:flex">
              {getPageNumbers().map((page, index) => (
                typeof page === 'number' ? (
                  <Button
                    key={page}
                    variant={page === currentPage ? 'default' : 'outline'}
                    size={size}
                    onClick={() => onPageChange(page)}
                    className={cn(
                      variant === 'pills' && 'rounded-full'
                    )}
                  >
                    {page}
                  </Button>
                ) : (
                  <Button
                    key={`ellipsis-${index}`}
                    variant="outline"
                    size={size}
                    disabled
                    className={cn(
                      variant === 'pills' && 'rounded-full'
                    )}
                  >
                    {page}
                  </Button>
                )
              ))}
            </div>

            <Button
              variant="outline"
              size={size}
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">Next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size={size}
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              className={cn(
                'rounded-r-md',
                variant === 'pills' && 'rounded-full'
              )}
            >
              <span className="sr-only">Last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </div>
    );
  }
);

Pagination.displayName = 'Pagination';

export { Pagination };