import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useCurrencyStore } from '../stores/currencyStore';
import { formatCurrency } from '../utils/currency';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import {
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Loader2,
  ChevronUp,
  ChevronDown,
  PieChart,
  BarChart3,
  LineChart,
  Users2,
  CreditCard,
  Layers,
  Cake,
} from 'lucide-react';

function Dashboard() {
  const { currency } = useCurrencyStore();

  // Get monthly trends data
  const { data: monthlyTrends, isLoading: trendsLoading } = useQuery({
    queryKey: ['monthly-trends'],
    queryFn: async () => {
      const today = new Date();
      const months = Array.from({ length: 12 }, (_, i) => {
        const date = subMonths(today, i);
        return {
          start: startOfMonth(date),
          end: endOfMonth(date),
          month: format(date, 'MMM yyyy'),
        };
      }).reverse();

      const monthlyData = await Promise.all(
        months.map(async ({ start, end, month }) => {
          const { data: transactions, error } = await supabase
            .from('financial_transactions')
            .select('type, amount, category')
            .gte('date', start.toISOString())
            .lte('date', end.toISOString());

          if (error) throw error;

          const income = transactions
            ?.filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

          const previousMonth = subMonths(start, 1);
          const { data: prevTransactions } = await supabase
            .from('financial_transactions')
            .select('type, amount')
            .gte('date', startOfMonth(previousMonth).toISOString())
            .lte('date', endOfMonth(previousMonth).toISOString())
            .eq('type', 'income');

          const previousIncome = prevTransactions
            ?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

          const percentageChange = previousIncome === 0 
            ? 100 
            : ((income - previousIncome) / previousIncome) * 100;

          return {
            month,
            income,
            percentageChange,
          };
        })
      );

      return monthlyData;
    },
  });

  // Get overall statistics
  const { data: overallStats, isLoading: statsLoading } = useQuery({
    queryKey: ['overall-stats'],
    queryFn: async () => {
      // Get all income transactions
      const { data: transactions, error } = await supabase
        .from('financial_transactions')
        .select(`
          amount,
          category,
          member:members (
            id,
            first_name,
            last_name
          )
        `)
        .eq('type', 'income');

      if (error) throw error;

      // Calculate total number of unique givers
      const uniqueGivers = new Set(
        transactions
          ?.filter(t => t.member)
          .map(t => t.member.id)
      ).size;

      // Calculate average gift amount
      const totalAmount = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const averageGift = transactions?.length ? totalAmount / transactions.length : 0;

      // Calculate top giving categories
      const categoryTotals = transactions?.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
        return acc;
      }, {} as Record<string, number>);

      const sortedCategories = Object.entries(categoryTotals || {})
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      return {
        uniqueGivers,
        averageGift,
        topCategories: sortedCategories,
      };
    },
  });

  // Get current year's data
  const { data: yearlyStats, isLoading: yearlyLoading } = useQuery({
    queryKey: ['yearly-stats'],
    queryFn: async () => {
      const today = new Date();
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      const endOfYear = new Date(today.getFullYear(), 11, 31);

      const { data: transactions, error: transactionsError } = await supabase
        .from('financial_transactions')
        .select(`
          type,
          amount,
          category,
          date,
          member:members (
            id,
            first_name,
            last_name
          )
        `)
        .gte('date', startOfYear.toISOString())
        .lte('date', endOfYear.toISOString());

      if (transactionsError) throw transactionsError;

      const yearlyIncome = transactions
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const yearlyExpenses = transactions
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Calculate member contributions
      const memberContributions = transactions
        ?.filter(t => t.type === 'income' && t.member)
        .reduce((acc, t) => {
          const memberId = t.member.id;
          if (!acc[memberId]) {
            acc[memberId] = {
              name: `${t.member.first_name} ${t.member.last_name}`,
              total: 0,
            };
          }
          acc[memberId].total += Number(t.amount);
          return acc;
        }, {} as Record<string, { name: string; total: number }>);

      return {
        yearlyIncome,
        yearlyExpenses,
        memberContributions: Object.values(memberContributions || {})
          .sort((a, b) => b.total - a.total)
          .slice(0, 5), // Top 5 contributors
      };
    },
  });

  // Get current month's data
  const { data: stats, isLoading: monthlyLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Get total members count
      const { count: membersCount, error: membersError } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null);

      if (membersError) throw membersError;

      // Get current month's transactions
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const { data: transactions, error: transactionsError } = await supabase
        .from('financial_transactions')
        .select('type, amount')
        .gte('date', firstDayOfMonth.toISOString())
        .lte('date', lastDayOfMonth.toISOString());

      if (transactionsError) throw transactionsError;

      const monthlyIncome = transactions
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const monthlyExpenses = transactions
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Get active budgets count
      const { data: activeBudgets, error: budgetsError } = await supabase
        .from('budgets')
        .select('id')
        .gte('end_date', today.toISOString())
        .lte('start_date', today.toISOString());

      if (budgetsError) throw budgetsError;

      return {
        totalMembers: membersCount || 0,
        monthlyIncome,
        monthlyExpenses,
        activeBudgets: activeBudgets?.length || 0,
      };
    },
  });

  // Get birthdays for current month
  const { data: birthdays, isLoading: birthdaysLoading } = useQuery({
    queryKey: ['birthdays'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_current_month_birthdays');
      if (error) throw error;
      return data;
    },
  });

  const isLoading = monthlyLoading || yearlyLoading || trendsLoading || statsLoading || birthdaysLoading;

  const cards = [
    {
      name: 'Total Members',
      value: stats?.totalMembers ?? '-',
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      name: 'Monthly Income',
      value: stats?.monthlyIncome
        ? formatCurrency(stats.monthlyIncome, currency)
        : '-',
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      name: 'Monthly Expenses',
      value: stats?.monthlyExpenses
        ? formatCurrency(stats.monthlyExpenses, currency)
        : '-',
      icon: DollarSign,
      color: 'bg-red-500',
    },
    {
      name: 'Active Budgets',
      value: stats?.activeBudgets ?? '-',
      icon: Calendar,
      color: 'bg-purple-500',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.name}
              className="bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon
                      className={`h-6 w-6 text-white p-1 rounded ${card.color}`}
                    />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {card.name}
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {card.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Monthly Trends */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <LineChart className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Monthly Trends</h3>
          </div>
          <div className="space-y-4">
            {monthlyTrends?.map((month) => (
              <div key={month.month}>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{month.month}</span>
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900">
                      {formatCurrency(month.income, currency)}
                    </span>
                    <span
                      className={`ml-2 flex items-center text-xs ${
                        month.percentageChange >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {month.percentageChange >= 0 ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      {Math.abs(month.percentageChange).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="mt-1">
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-primary-100">
                    <div
                      style={{
                        width: `${(month.income / Math.max(...monthlyTrends.map(m => m.income))) * 100}%`,
                      }}
                      className="bg-primary-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Overall Statistics */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <BarChart3 className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Overall Statistics</h3>
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center text-sm text-gray-500">
                  <Users2 className="h-4 w-4 mr-1" />
                  Total Givers
                </div>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {overallStats?.uniqueGivers || 0}
                </p>
              </div>
              <div>
                <div className="flex items-center text-sm text-gray-500">
                  <CreditCard className="h-4 w-4 mr-1" />
                  Average Gift
                </div>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {formatCurrency(overallStats?.averageGift || 0, currency)}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center text-sm text-gray-500 mb-2">
                <Layers className="h-4 w-4 mr-1" />
                Top Giving Categories
              </div>
              <div className="space-y-2">
                {overallStats?.topCategories.map(([category, amount]) => (
                  <div key={category}>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {category.split('_').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(amount, currency)}
                      </span>
                    </div>
                    <div className="mt-1">
                      <div className="overflow-hidden h-2 text-xs flex rounded bg-primary-100">
                        <div
                          style={{
                            width: `${(amount / overallStats.topCategories[0][1]) * 100}%`,
                          }}
                          className="bg-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Annual Financial Overview */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <BarChart3 className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Annual Overview</h3>
          </div>
          {yearlyStats && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Annual Income</span>
                  <span className="flex items-center text-green-600">
                    {formatCurrency(yearlyStats.yearlyIncome, currency)}
                    <ChevronUp className="h-4 w-4 ml-1" />
                  </span>
                </div>
                <div className="mt-1">
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-green-100">
                    <div
                      style={{ width: '100%' }}
                      className="bg-green-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Annual Expenses</span>
                  <span className="flex items-center text-red-600">
                    {formatCurrency(yearlyStats.yearlyExpenses, currency)}
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </span>
                </div>
                <div className="mt-1">
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-red-100">
                    <div
                      style={{ width: `${(yearlyStats.yearlyExpenses / yearlyStats.yearlyIncome) * 100}%` }}
                      className="bg-red-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Net Balance</span>
                  <span className={yearlyStats.yearlyIncome - yearlyStats.yearlyExpenses >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(yearlyStats.yearlyIncome - yearlyStats.yearlyExpenses, currency)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Birthdays This Month */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Cake className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Birthdays This Month</h3>
          </div>
          {birthdays && birthdays.length > 0 ? (
            <div className="space-y-4">
              {birthdays.map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 font-medium">
                        {member.first_name[0]}
                      </span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {member.first_name} {member.last_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(member.birthday), 'MMMM d')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-primary-500" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No birthdays this month</p>
          )}
        </div>
      </div>

      <div className="mt-8 bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Monthly Financial Summary
          </h3>
          <div className="mt-4">
            {stats && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Monthly Balance</span>
                    <span className={stats.monthlyIncome - stats.monthlyExpenses >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(Math.abs(stats.monthlyIncome - stats.monthlyExpenses), currency)}
                      {stats.monthlyIncome - stats.monthlyExpenses < 0 && ' (Deficit)'}
                    </span>
                  </div>
                  <div className="mt-1">
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                      <div
                        style={{ width: `${Math.min((stats.monthlyIncome / (stats.monthlyExpenses || 1)) * 100, 100)}%` }}
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                          stats.monthlyIncome >= stats.monthlyExpenses
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Income Breakdown</h4>
                    <p className="mt-1 text-2xl font-semibold text-green-600">
                      {formatCurrency(stats.monthlyIncome, currency)}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Expense Breakdown</h4>
                    <p className="mt-1 text-2xl font-semibold text-red-600">
                      {formatCurrency(stats.monthlyExpenses, currency)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;