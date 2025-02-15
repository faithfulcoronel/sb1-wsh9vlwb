import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns';
import { useCurrencyStore } from '../../stores/currencyStore';
import { formatCurrency } from '../../utils/currency';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { ArrowLeft, Download, Filter, Loader2, FileSpreadsheet, FileText, PieChart, BarChart3, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

const Reports = () => {
  const navigate = useNavigate();
  const { currency } = useCurrencyStore();
  const [dateRange, setDateRange] = useState<DateRange>('monthly');
  const [startDate, setStartDate] = useState<string>(
    format(startOfMonth(new Date()), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState<string>(
    format(endOfMonth(new Date()), 'yyyy-MM-dd')
  );

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
    queryKey: ['financial-report', dateRange, startDate, endDate],
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
          acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
          return acc;
        }, {} as Record<string, number>);

      const expensesByCategory = transactions
        ?.filter((t) => t.type === 'expense')
        .reduce((acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
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

  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    let yPos = 20;

    // Title
    doc.setFontSize(16);
    doc.text('Financial Report', 20, yPos);
    yPos += 10;

    // Date Range
    doc.setFontSize(12);
    doc.text(
      `Period: ${format(new Date(startDate), 'MMM d, yyyy')} - ${format(
        new Date(endDate),
        'MMM d, yyyy'
      )}`,
      20,
      yPos
    );
    yPos += 10;

    // Summary
    doc.setFontSize(14);
    doc.text('Summary', 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.text(`Total Income: ${formatCurrency(reportData?.totalIncome || 0, currency)}`, 30, yPos);
    yPos += 7;
    doc.text(
      `Total Expenses: ${formatCurrency(reportData?.totalExpenses || 0, currency)}`,
      30,
      yPos
    );
    yPos += 7;
    doc.text(
      `Net Balance: ${formatCurrency(
        (reportData?.totalIncome || 0) - (reportData?.totalExpenses || 0),
        currency
      )}`,
      30,
      yPos
    );
    yPos += 15;

    // Category Breakdown
    doc.setFontSize(14);
    doc.text('Income by Category', 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    Object.entries(reportData?.incomeByCategory || {}).forEach(([category, amount]) => {
      doc.text(`${formatStatus(category)}: ${formatCurrency(amount, currency)}`, 30, yPos);
      yPos += 7;
    });

    yPos += 5;
    doc.setFontSize(14);
    doc.text('Expenses by Category', 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    Object.entries(reportData?.expensesByCategory || {}).forEach(([category, amount]) => {
      doc.text(`${formatStatus(category)}: ${formatCurrency(amount, currency)}`, 30, yPos);
      yPos += 7;
    });

    doc.save('financial-report.pdf');
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['Financial Report'],
      [
        `Period: ${format(new Date(startDate), 'MMM d, yyyy')} - ${format(
          new Date(endDate),
          'MMM d, yyyy'
        )}`,
      ],
      [],
      ['Summary'],
      ['Total Income', reportData?.totalIncome || 0],
      ['Total Expenses', reportData?.totalExpenses || 0],
      ['Net Balance', (reportData?.totalIncome || 0) - (reportData?.totalExpenses || 0)],
      [],
      ['Income by Category'],
      ...Object.entries(reportData?.incomeByCategory || {}).map(([category, amount]) => [
        formatStatus(category),
        amount,
      ]),
      [],
      ['Expenses by Category'],
      ...Object.entries(reportData?.expensesByCategory || {}).map(([category, amount]) => [
        formatStatus(category),
        amount,
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws, 'Summary');

    // Transactions Sheet
    const transactionsData = [
      ['Date', 'Type', 'Category', 'Description', 'Amount', 'Member/Budget'],
      ...reportData?.transactions.map((t) => [
        format(new Date(t.date), 'MMM d, yyyy'),
        t.type,
        formatStatus(t.category),
        t.description,
        t.amount,
        t.member
          ? `${t.member.first_name} ${t.member.last_name}`
          : t.budget?.name || '-',
      ]),
    ];

    const wsTransactions = XLSX.utils.aoa_to_sheet(transactionsData);
    XLSX.utils.book_append_sheet(wb, wsTransactions, 'Transactions');

    // Member Contributions Sheet
    const contributionsData = [
      ['Member', 'Total Contribution'],
      ...reportData?.memberContributions.map((m) => [
        `${m.first_name} ${m.last_name}`,
        m.total,
      ]),
    ];

    const wsContributions = XLSX.utils.aoa_to_sheet(contributionsData);
    XLSX.utils.book_append_sheet(wb, wsContributions, 'Member Contributions');

    // Budget Comparison Sheet
    const budgetData = [
      ['Budget Name', 'Allocated Amount', 'Used Amount', 'Remaining'],
      ...reportData?.budgetComparison.map((b) => [
        b.name,
        b.amount,
        b.used_amount,
        b.amount - b.used_amount,
      ]),
    ];

    const wsBudget = XLSX.utils.aoa_to_sheet(budgetData);
    XLSX.utils.book_append_sheet(wb, wsBudget, 'Budget Comparison');

    XLSX.writeFile(wb, 'financial-report.xlsx');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/finances')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Finances
        </button>
      </div>

      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Financial Reports</h1>
          <p className="mt-2 text-sm text-gray-700">
            Comprehensive financial analysis and reporting
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={exportToExcel}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export to Excel
          </button>
          <button
            onClick={exportToPDF}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export to PDF
          </button>
        </div>
      </div>

      <div className="mt-6 bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:flex sm:items-center space-x-4">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Filter className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  className="block w-full pl-10 pr-10 py-2 text-sm border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  value={dateRange}
                  onChange={(e) => handleDateRangeChange(e.target.value as DateRange)}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {dateRange === 'custom' && (
                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="block w-full text-sm border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="block w-full text-sm border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : (
            <div className="mt-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="bg-green-50 overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <TrendingUp className="h-6 w-6 text-green-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-green-500 truncate">
                            Total Income
                          </dt>
                          <dd className="text-lg font-semibold text-green-900">
                            {formatCurrency(reportData?.totalIncome || 0, currency)}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <TrendingDown className="h-6 w-6 text-red-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-red-500 truncate">
                            Total Expenses
                          </dt>
                          <dd className="text-lg font-semibold text-red-900">
                            {formatCurrency(reportData?.totalExpenses || 0, currency)}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`${
                    reportData?.totalIncome - reportData?.totalExpenses >= 0
                      ? 'bg-green-50'
                      : 'bg-red-50'
                  } overflow-hidden shadow rounded-lg`}
                >
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <DollarSign
                          className={`h-6 w-6 ${
                            reportData?.totalIncome - reportData?.totalExpenses >= 0
                              ? 'text-green-400'
                              : 'text-red-400'
                          }`}
                        />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt
                            className={`text-sm font-medium truncate ${
                              reportData?.totalIncome - reportData?.totalExpenses >= 0
                                ? 'text-green-500'
                                : 'text-red-500'
                            }`}
                          >
                            Net Balance
                          </dt>
                          <dd
                            className={`text-lg font-semibold ${
                              reportData?.totalIncome - reportData?.totalExpenses >= 0
                                ? 'text-green-900'
                                : 'text-red-900'
                            }`}
                          >
                            {formatCurrency(
                              Math.abs(
                                (reportData?.totalIncome || 0) - (reportData?.totalExpenses || 0)
                              ),
                              currency
                            )}
                            {reportData?.totalIncome - reportData?.totalExpenses < 0 && ' (Deficit)'}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                      <PieChart className="h-5 w-5 mr-2" />
                      Income by Category
                    </h3>
                  </div>
                  <div className="border-t border-gray-200">
                    <dl className="sm:divide-y sm:divide-gray-200">
                      {Object.entries(reportData?.incomeByCategory || {}).map(
                        ([category, amount]) => (
                          <div key={category} className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="text-sm font-medium text-gray-500">
                              {formatStatus(category)}
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {formatCurrency(amount, currency)}
                            </dd>
                          </div>
                        )
                      )}
                    </dl>
                  </div>
                </div>

                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2" />
                      Expenses by Category
                    </h3>
                  </div>
                  <div className="border-t border-gray-200">
                    <dl className="sm:divide-y sm:divide-gray-200">
                      {Object.entries(reportData?.expensesByCategory || {}).map(
                        ([category, amount]) => (
                          <div key={category} className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="text-sm font-medium text-gray-500">
                              {formatStatus(category)}
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {formatCurrency(amount, currency)}
                            </dd>
                          </div>
                        )
                      )}
                    </dl>
                  </div>
                </div>
              </div>

              {/* Member Contributions */}
              <div className="mt-8">
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Member Contributions
                    </h3>
                  </div>
                  <div className="border-t border-gray-200">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Member
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Total Contribution
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData?.memberContributions.map((member) => (
                            <tr key={member.member_id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {member.first_name} {member.last_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                {formatCurrency(member.total, currency)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Budget Comparison */}
              <div className="mt-8">
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Budget vs. Actual
                    </h3>
                  </div>
                  <div className="border-t border-gray-200">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Budget
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Allocated
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Used
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Remaining
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Progress
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData?.budgetComparison.map((budget) => {
                            const percentage = (budget.used_amount / budget.amount) * 100;
                            return (
                              <tr key={budget.budget_id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {budget.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                  {formatCurrency(budget.amount, currency)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                  {formatCurrency(budget.used_amount, currency)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                  {formatCurrency(budget.amount - budget.used_amount, currency)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center justify-center">
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                      <div
                                        className={`h-2.5 rounded-full ${
                                          percentage > 90
                                            ? 'bg-red-500'
                                            : percentage > 70
                                            ? 'bg-yellow-500'
                                            : 'bg-green-500'
                                        }`}
                                        style={{ width: `${Math.min(percentage, 100)}%` }}
                                      ></div>
                                    </div>
                                    <span className="ml-2 text-xs text-gray-500">
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
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;