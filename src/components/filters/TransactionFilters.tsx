import React from 'react';
import { Card, CardContent } from '../ui2/card';
import { Input } from '../ui2/input';
import { Button } from '../ui2/button';
import { Badge } from '../ui2/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui2/select';
import { DatePickerInput } from '../ui2/date-picker';
import { AmountRangeFilter } from './AmountRangeFilter';
import {
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  X,
  Calendar,
} from 'lucide-react';

export interface TransactionFilter {
  searchTerm: string;
  typeFilter: string;
  categoryFilter: string;
  dateRange: {
    start: string;
    end: string;
  };
  amountRange: {
    min: string;
    max: string;
  };
  entityFilter: string;
}

interface TransactionFiltersProps {
  filters: TransactionFilter;
  onFilterChange: (filters: Partial<TransactionFilter>) => void;
  onResetFilters: () => void;
  activeFilters: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    onRemove: () => void;
  }>;
}

export function TransactionFilters({
  filters,
  onFilterChange,
  onResetFilters,
  activeFilters,
}: TransactionFiltersProps) {
  return (
    <Card className="mt-6">
      <CardContent className="p-4 space-y-4">
        {/* Search and Quick Filters */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Input
              placeholder="Search transactions..."
              value={filters.searchTerm}
              onChange={(e) => onFilterChange({ searchTerm: e.target.value })}
              icon={<Search className="h-4 w-4" />}
              clearable
              onClear={() => onFilterChange({ searchTerm: '' })}
            />
          </div>

          <div>
            <Select
              value={filters.typeFilter}
              onValueChange={(value) => onFilterChange({ typeFilter: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-success" />
                    Income
                  </div>
                </SelectItem>
                <SelectItem value="expense">
                  <div className="flex items-center">
                    <TrendingDown className="h-4 w-4 mr-2 text-destructive" />
                    Expense
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select
              value={filters.categoryFilter}
              onValueChange={(value) => onFilterChange({ categoryFilter: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {/* Categories will be populated from the parent component */}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Input
              placeholder="Search by member/budget..."
              value={filters.entityFilter}
              onChange={(e) => onFilterChange({ entityFilter: e.target.value })}
              clearable
              onClear={() => onFilterChange({ entityFilter: '' })}
            />
          </div>
        </div>

        {/* Date and Amount Range */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Date Range
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <DatePickerInput
                  value={filters.dateRange.start ? new Date(filters.dateRange.start) : undefined}
                  onChange={(date) => onFilterChange({
                    dateRange: {
                      ...filters.dateRange,
                      start: date?.toISOString().split('T')[0] || '',
                    }
                  })}
                  placeholder="Start Date"
                  icon={<Calendar className="h-4 w-4" />}
                />
              </div>
              <div className="flex-1">
                <DatePickerInput
                  value={filters.dateRange.end ? new Date(filters.dateRange.end) : undefined}
                  onChange={(date) => onFilterChange({
                    dateRange: {
                      ...filters.dateRange,
                      end: date?.toISOString().split('T')[0] || '',
                    }
                  })}
                  placeholder="End Date"
                  icon={<Calendar className="h-4 w-4" />}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Amount Range
            </label>
            <AmountRangeFilter
              value={filters.amountRange}
              onChange={(value) => onFilterChange({ amountRange: value })}
            />
          </div>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
            {activeFilters.map(filter => (
              <Badge
                key={filter.id}
                variant="secondary"
                className="flex items-center space-x-1 px-2 py-1"
              >
                {filter.icon}
                <span>{filter.label}</span>
                <button
                  onClick={filter.onRemove}
                  className="ml-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear All
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}