import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns';
import { useCurrencyStore } from '../../stores/currencyStore';
import { formatCurrency } from '../../utils/currency';
import { PDFViewer } from '../../components/ui2/pdf-viewer';
import { PDFRenderer, PDFText, PDFTable } from '../../components/ui2/pdf-renderer';
import { Card, CardHeader, CardContent } from '../../components/ui2/card';
import { Button } from '../../components/ui2/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui2/select';
import { DatePickerInput } from '../../components/ui2/date-picker';
import { Badge } from '../../components/ui2/badge';
import { Progress } from '../../components/ui2/progress';
import { Charts } from '../../components/ui2/charts';
import { PrintableReport, PrintableTable } from '../../components/ui2/PrintableReport';
import {
  ArrowLeft,
  Download,
  Filter,
  Loader2,
  FileSpreadsheet,
  FileText,
  PieChart,
  BarChart3,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Eye,
  Printer
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createRoot } from 'react-dom/client';

type DateRange = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

type ReportData = {
  transactions: any[];
  totalIncome: number;
  totalExpenses: number;
  incomeByCategory: Record<string, number>;
  expensesByCategory: Record<string, number>;
  memberContributions: Array<{
    member_id: string;
    first_name: string;
    last_name: string;
    total: number;
  }>;
  budgetComparison: Array<{
    budget_id: string;
    name: string;
    amount: number;
    used_amount: number;
  }>;
};

function Reports() {
  const navigate = useNavigate();
  const { currency } = useCurrencyStore();
  const [dateRange, setDateRange] = useState<DateRange>('monthly');
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPDFViewer, setShowPDFViewer] = useState(false);

  const getDateRange = (range: DateRange) => {
    const today = new Date();
    switch (range) {
      case 'daily':
        return {
          start: startOfDay(today),
          end: endOfDay(today),
        };
      case 'weekly':
        return {
          start: startOfWeek(today, { weekStartsOn: 1 }),
          end: endOfWeek(today, { weekStartsOn: 1 }),
        };
      case 'monthly':
        return {
          start: startOfMonth(today),
          end: endOfMonth(today),
        };
      case 'yearly':
        return {
          start: startOfYear(today),
          end: endOfYear(today),
        };
      case 'custom':
        return {
          start: new Date(startDate),
          end: new Date(endDate),
        };
      default:
        return {
          start: startOfMonth(today),
          end: endOfMonth(today),
        };
    }
  };

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['financial-report', dateRange, startDate, endDate, actionFilter, entityFilter],
    queryFn: async () => {
      const { start, end } = getDateRange(dateRange);
      const startDateStr = format(start, 'yyyy-MM-dd');
      const endDateStr = format(end, 'yyyy-MM-dd');

      // Get all transactions for the period
      const { data: transactions, error: transactionsError } = await supabase
        .from('financial_transactions')
        .select(`
          *,
          member:member_id (
            first_name,
            last_name
          ),
          budget:budget_id (
            name
          ),
          category:category_id (
            name
          )
        `)
        .gte('date', startDateStr)
        .lte('date', endDateStr)
        .order('date', { ascending: false });

      if (transactionsError) throw transactionsError;

      // Get budgets that overlap with the date range
      const { data: budgets, error: budgetsError } = await supabase
        .from('budgets')
        .select('*')
        .or(`start_date.lte.${endDateStr},end_date.gte.${startDateStr}`);

      if (budgetsError) throw budgetsError;

      // Calculate totals and category breakdowns
      const totalIncome = transactions
        ?.filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const totalExpenses = transactions
        ?.filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const incomeByCategory = transactions
        ?.filter((t) => t.type === 'income')
        .reduce((acc, t) => {
          const categoryName = t.category?.name || 'Uncategorized';
          acc[categoryName] = (acc[categoryName] || 0) + Number(t.amount);
          return acc;
        }, {} as Record<string, number>);

      const expensesByCategory = transactions
        ?.filter((t) => t.type === 'expense')
        .reduce((acc, t) => {
          const categoryName = t.category?.name || 'Uncategorized';
          acc[categoryName] = (acc[categoryName] || 0) + Number(t.amount);
          return acc;
        }, {} as Record<string, number>);

      // Get member contributions
      const memberContributions = transactions
        ?.filter((t) => t.type === 'income' && t.member)
        .reduce((acc, t) => {
          const key = t.member_id;
          if (!acc[key]) {
            acc[key] = {
              member_id: t.member_id,
              first_name: t.member.first_name,
              last_name: t.member.last_name,
              total: 0,
            };
          }
          acc[key].total += Number(t.amount);
          return acc;
        }, {} as Record<string, any>);

      const budgetComparison = await Promise.all(
        (budgets || []).map(async (budget) => {
          const { data: budgetTransactions, error: budgetTransError } = await supabase
            .from('financial_transactions')
            .select('amount')
            .eq('budget_id', budget.id)
            .eq('type', 'expense');

          if (budgetTransError) throw budgetTransError;

          const used_amount = budgetTransactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

          return {
            budget_id: budget.id,
            name: budget.name,
            amount: budget.amount,
            used_amount,
          };
        })
      );

      return {
        transactions: transactions || [],
        totalIncome,
        totalExpenses,
        incomeByCategory,
        expensesByCategory,
        memberContributions: Object.values(memberContributions || {}),
        budgetComparison,
      } as ReportData;
    },
  });

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    if (range !== 'custom') {
      const { start, end } = getDateRange(range);
      setStartDate(format(start, 'yyyy-MM-dd'));
      setEndDate(format(end, 'yyyy-MM-dd'));
    }
  };

  const generatePDFContent = () => {
    if (!reportData) return null;

    const { start, end } = getDateRange(dateRange);
    const dateRangeText = `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;

    return {
      sections: [
        {
          title: 'Financial Summary',
          content: (
            <>
              <PDFText style={{ marginBottom: 10 }}>
                Report Period: {dateRangeText}
              </PDFText>
              <PDFTable
                headers={['Category', 'Amount']}
                data={[
                  ['Total Income', formatCurrency(reportData.totalIncome, currency)],
                  ['Total Expenses', formatCurrency(reportData.totalExpenses, currency)],
                  ['Net Balance', formatCurrency(reportData.totalIncome - reportData.totalExpenses, currency)],
                ]}
                widths={[2, 1]}
              />
            </>
          ),
        },
        {
          title: 'Income by Category',
          content: (
            <PDFTable
              headers={['Category', 'Amount', 'Percentage']}
              data={Object.entries(reportData.incomeByCategory).map(([category, amount]) => [
                category,
                formatCurrency(amount, currency),
                `${((amount / reportData.totalIncome) * 100).toFixed(1)}%`,
              ])}
              widths={[2, 1, 1]}
            />
          ),
        },
        {
          title: 'Expenses by Category',
          content: (
            <PDFTable
              headers={['Category', 'Amount', 'Percentage']}
              data={Object.entries(reportData.expensesByCategory).map(([category, amount]) => [
                category,
                formatCurrency(amount, currency),
                `${((amount / reportData.totalExpenses) * 100).toFixed(1)}%`,
              ])}
              widths={[2, 1, 1]}
            />
          ),
        },
        {
          title: 'Budget Comparison',
          content: (
            <PDFTable
              headers={['Budget', 'Allocated', 'Used', 'Remaining', 'Usage']}
              data={reportData.budgetComparison.map((budget) => [
                budget.name,
                formatCurrency(budget.amount, currency),
                formatCurrency(budget.used_amount, currency),
                formatCurrency(budget.amount - budget.used_amount, currency),
                `${((budget.used_amount / budget.amount) * 100).toFixed(1)}%`,
              ])}
              widths={[2, 1, 1, 1, 1]}
            />
          ),
        },
        {
          title: 'Member Contributions',
          content: (
            <PDFTable
              headers={['Member', 'Total Contribution', 'Percentage']}
              data={reportData.memberContributions.map((member) => [
                `${member.first_name} ${member.last_name}`,
                formatCurrency(member.total, currency),
                `${((member.total / reportData.totalIncome) * 100).toFixed(1)}%`,
              ])}
              widths={[2, 1, 1]}
            />
          ),
        },
      ],
    };
  };

  const openPrintableReport = () => {
    // Open new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Render the report content
    const reportContent = {
      sections: [
        {
          title: 'Financial Summary',
          content: (
            <PrintableTable
              headers={['Category', 'Amount']}
              data={[
                ['Total Income', reportData?.totalIncome || 0],
                ['Total Expenses', reportData?.totalExpenses || 0],
                ['Net Balance', (reportData?.totalIncome || 0) - (reportData?.totalExpenses || 0)],
              ]}
            />
          ),
        },
        {
          title: 'Income by Category',
          content: (
            <PrintableTable
              headers={['Category', 'Amount', 'Percentage']}
              data={Object.entries(reportData?.incomeByCategory || {}).map(([category, amount]) => [
                category,
                amount,
                `${((amount / (reportData?.totalIncome || 1)) * 100).toFixed(1)}%`,
              ])}
            />
          ),
        },
        {
          title: 'Expenses by Category',
          content: (
            <PrintableTable
              headers={['Category', 'Amount', 'Percentage']}
              data={Object.entries(reportData?.expensesByCategory || {}).map(([category, amount]) => [
                category,
                amount,
                `${((amount / (reportData?.totalExpenses || 1)) * 100).toFixed(1)}%`,
              ])}
            />
          ),
        },
        {
          title: 'Budget Comparison',
          content: (
            <PrintableTable
              headers={['Budget', 'Allocated', 'Used', 'Remaining', 'Usage']}
              data={reportData?.budgetComparison.map(budget => [
                budget.name,
                budget.amount,
                budget.used_amount,
                budget.amount - budget.used_amount,
                `${((budget.used_amount / budget.amount) * 100).toFixed(1)}%`,
              ]) || []}
            />
          ),
        },
        {
          title: 'Member Contributions',
          content: (
            <PrintableTable
              headers={['Member', 'Total Contribution', 'Percentage']}
              data={reportData?.memberContributions.map(member => [
                `${member.first_name} ${member.last_name}`,
                member.total,
                `${((member.total / (reportData?.totalIncome || 1)) * 100).toFixed(1)}%`,
              ]) || []}
            />
          ),
        },
      ],
    };

    // Write initial HTML
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Financial Report</title>
          <link rel="stylesheet" href="${window.location.origin}/src/styles/globals.css">
        </head>
        <body>
          <div id="report-root"></div>
        </body>
      </html>
    `);

    // Wait for document to be ready
    printWindow.document.close();

    // Create root and render using modern React 18 API
    const reportRoot = printWindow.document.getElementById('report-root');
    if (reportRoot) {
      const { start, end } = getDateRange(dateRange);
      const dateRangeText = `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;

      const root = createRoot(reportRoot);
      root.render(
        <PrintableReport
          title={`Financial Report (${dateRangeText})`}
          content={reportContent}
          footer={`Report Period: ${dateRangeText}`}
        />
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/finances')}
          className="flex items-center"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Finances
        </Button>
      </div>

      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Financial Reports</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Comprehensive financial analysis and reporting
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowPDFViewer(true)}
            className="flex items-center"
          >
            <Eye className="h-4 w-4 mr-2" />
            View PDF
          </Button>
          <Button
            variant="default"
            onClick={() => setShowPDFViewer(false)}
            className="flex items-center"
          >
            <FileText className="h-4 w-4 mr-2" />
            View Report
          </Button>
        </div>
      </div>

      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:flex sm:items-center space-x-4">
              <div className="relative">
                <Select
                  value={dateRange}
                  onValueChange={(value) => handleDateRangeChange(value as DateRange)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Today</SelectItem>
                    <SelectItem value="weekly">This Week</SelectItem>
                    <SelectItem value="monthly">This Month</SelectItem>
                    <SelectItem value="yearly">This Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dateRange === 'custom' && (
                <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                  <DatePickerInput
                    value={startDate ? new Date(startDate) : undefined}
                    onChange={(date) => setStartDate(date?.toISOString().split('T')[0] || '')}
                    placeholder="Start Date"
                  />
                  <span className="text-muted-foreground">to</span>
                  <DatePickerInput
                    value={endDate ? new Date(endDate) : undefined}
                    onChange={(date) => setEndDate(date?.toISOString().split('T')[0] || '')}
                    placeholder="End Date"
                  />
                </div>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : reportData ? (
            <div className="mt-6">
              {/* Add Print Report button */}
              <div className="flex justify-end mb-6">
                <Button
                  variant="default"
                  onClick={openPrintableReport}
                  className="flex items-center"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Report
                </Button>
              </div>

              {showPDFViewer ? (
                <PDFRenderer
                  title={`Financial Report (${format(new Date(startDate), 'MMM d, yyyy')} - ${format(new Date(endDate), 'MMM d, yyyy')})`}
                  content={generatePDFContent()!}
                  footer={`Generated on ${format(new Date(), 'MMM d, yyyy')}`}
                  className="min-h-[800px] mt-6"
                />
              ) : (
                <div className="mt-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <TrendingUp className="h-6 w-6 text-success" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-success">
                                Total Income
                              </dt>
                              <dd className="text-2xl font-semibold text-success">
                                {formatCurrency(reportData.totalIncome, currency)}
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <TrendingDown className="h-6 w-6 text-destructive" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-destructive">
                                Total Expenses
                              </dt>
                              <dd className="text-2xl font-semibold text-destructive">
                                {formatCurrency(reportData.totalExpenses, currency)}
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <DollarSign className={`h-6 w-6 ${
                              reportData.totalIncome - reportData.totalExpenses >= 0
                                ? 'text-success'
                                : 'text-destructive'
                            }`} />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className={`text-sm font-medium ${
                                reportData.totalIncome - reportData.totalExpenses >= 0
                                  ? 'text-success'
                                  : 'text-destructive'
                              }`}>
                                Net Balance
                              </dt>
                              <dd className={`text-2xl font-semibold ${
                                reportData.totalIncome - reportData.totalExpenses >= 0
                                  ? 'text-success'
                                  : 'text-destructive'
                              }`}>
                                {formatCurrency(
                                  Math.abs(reportData.totalIncome - reportData.totalExpenses),
                                  currency
                                )}
                                {reportData.totalIncome - reportData.totalExpenses < 0 && ' (Deficit)'}
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Category Distribution Charts */}
                  <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-medium text-foreground flex items-center">
                          <PieChart className="h-5 w-5 text-success mr-2" />
                          Income by Category
                        </h3>
                      </CardHeader>
                      <CardContent>
                        <Charts
                          type="donut"
                          series={Object.values(reportData.incomeByCategory)}
                          options={{
                            chart: {
                              type: 'donut',
                            },
                            labels: Object.keys(reportData.incomeByCategory),
                            legend: {
                              position: 'bottom',
                              labels: {
                                colors: 'hsl(var(--foreground))'
                              }
                            },
                            dataLabels: {
                              enabled: true,
                              formatter: (value: number) => formatCurrency(value, currency)
                            },
                            tooltip: {
                              y: {
                                formatter: (value: number) => formatCurrency(value, currency)
                              }
                            }
                          }}
                          height={350}
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-medium text-foreground flex items-center">
                          <PieChart className="h-5 w-5 text-destructive mr-2" />
                          Expenses by Category
                        </h3>
                      </CardHeader>
                      <CardContent>
                        <Charts
                          type="donut"
                          series={Object.values(reportData.expensesByCategory)}
                          options={{
                            chart: {
                              type: 'donut',
                            },
                            labels: Object.keys(reportData.expensesByCategory),
                            legend: {
                              position: 'bottom',
                              labels: {
                                colors: 'hsl(var(--foreground))'
                              }
                            },
                            dataLabels: {
                              enabled: true,
                              formatter: (value: number) => formatCurrency(value, currency)
                            },
                            tooltip: {
                              y: {
                                formatter: (value: number) => formatCurrency(value, currency)
                              }
                            }
                          }}
                          height={350}
                        />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Member Contributions */}
                  <Card className="mt-8">
                    <CardHeader>
                      <h3 className="text-lg font-medium text-foreground">
                        Member Contributions
                      </h3>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                          <thead>
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Member
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Total Contribution
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-background divide-y divide-border">
                            {reportData.memberContributions.map((member) => (
                              <tr key={member.member_id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                  {member.first_name} {member.last_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-foreground">
                                  {formatCurrency(member.total, currency)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Budget Comparison */}
                  <Card className="mt-8">
                    <CardHeader>
                      <h3 className="text-lg font-medium text-foreground">
                        Budget vs. Actual
                      </h3>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                          <thead>
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Budget
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Allocated
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Used
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Remaining
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Progress
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-background divide-y divide-border">
                            {reportData.budgetComparison.map((budget) => {
                              const percentage = (budget.used_amount / budget.amount) * 100;
                              return (
                                <tr key={budget.budget_id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                    {budget.name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-foreground">
                                    {formatCurrency(budget.amount, currency)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-foreground">
                                    {formatCurrency(budget.used_amount, currency)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-foreground">
                                    {formatCurrency(budget.amount - budget.used_amount, currency)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center justify-center">
                                      <div className="w-full bg-muted rounded-full h-2.5">
                                        <div
                                          className={`h-2.5 rounded-full ${
                                            percentage > 90
                                              ? 'bg-destructive'
                                              : percentage > 70
                                              ? 'bg-warning'
                                              : 'bg-success'
                                          }`}
                                          style={{ width: `${Math.min(percentage, 100)}%` }}
                                        />
                                      </div>
                                      <span className="ml-2 text-xs text-muted-foreground">
                                        {percentage.toFixed(1)}%
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No data available for the selected date range
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Reports;