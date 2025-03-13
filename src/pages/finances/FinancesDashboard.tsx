import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { format, subMonths, startOfMonth, endOfMonth, endOfDay, startOfDay } from 'date-fns';
import { useCurrencyStore } from '../../stores/currencyStore';
import { formatCurrency } from '../../utils/currency';
import { Card, CardHeader, CardContent } from '../../components/ui2/card';
import { Button } from '../../components/ui2/button';
import { Badge } from '../../components/ui2/badge';
import { Progress } from '../../components/ui2/progress';
import { Charts } from '../../components/ui2/charts';
import { SubscriptionGate } from '../../components/SubscriptionGate';
import { DropdownButton } from '../../components/ui2/dropdown-button';
import {
  Plus,
  Upload,
  PiggyBank,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Loader2,
  ChevronUp,
  ChevronDown,
  PieChart,
  BarChart3,
  LineChart,
  Target,
  Award,
  Users2,
  CreditCard,
  Layers,
  ChevronRight,
} from 'lucide-react';

function FinancesDashboard() {
  const navigate = useNavigate();
  const { currency } = useCurrencyStore();

  // Get current tenant
  const { data: currentTenant } = useQuery({
    queryKey: ['current-tenant'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_current_tenant');
      if (error) throw error;
      return data?.[0];
    },
  });

  // Get monthly trends data
  const { data: monthlyTrends, isLoading: trendsLoading } = useQuery({
    queryKey: ['monthly-trends', currentTenant?.id],
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
            .select(`
              type,
              amount,
              category:category_id (
                name,
                type
              )
            `)
            .eq('tenant_id', currentTenant?.id)
            .gte('date', format(startOfDay(start), 'yyyy-MM-dd'))
            .lte('date', format(endOfDay(end), 'yyyy-MM-dd'));

          if (error) throw error;

          const income = transactions
            ?.filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

          const expenses = transactions
            ?.filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

          const previousMonth = subMonths(start, 1);
          const { data: prevTransactions } = await supabase
            .from('financial_transactions')
            .select('amount')
            .eq('tenant_id', currentTenant?.id)
            .eq('type', 'income')
            .gte('date', format(startOfDay(startOfMonth(previousMonth)), 'yyyy-MM-dd'))
            .lte('date', format(endOfDay(endOfMonth(previousMonth)), 'yyyy-MM-dd'));

          const previousIncome = prevTransactions
            ?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

          const percentageChange = previousIncome === 0 
            ? 100 
            : ((income - previousIncome) / previousIncome) * 100;

          return {
            month,
            income,
            expenses,
            percentageChange,
          };
        })
      );

      return monthlyData;
    },
    enabled: !!currentTenant?.id,
  });

  // Get current month's data
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['finance-stats', currentTenant?.id],
    queryFn: async () => {
      const today = new Date();
      const firstDayOfMonth = startOfMonth(today);
      const lastDayOfMonth = endOfMonth(today);

      const { data: transactions, error: transactionsError } = await supabase
        .from('financial_transactions')
        .select(`
          type,
          amount,
          category:category_id (
            id,
            name,
            type
          )
        `)
        .eq('tenant_id', currentTenant?.id)
        .gte('date', format(startOfDay(firstDayOfMonth), 'yyyy-MM-dd'))
        .lte('date', format(endOfDay(lastDayOfMonth), 'yyyy-MM-dd'));

      if (transactionsError) throw transactionsError;

      const monthlyIncome = transactions
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const monthlyExpenses = transactions
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Calculate category breakdowns
      const incomeByCategory = transactions
        ?.filter(t => t.type === 'income')
        .reduce((acc, t) => {
          const categoryName = t.category?.name || 'Uncategorized';
          acc[categoryName] = (acc[categoryName] || 0) + Number(t.amount);
          return acc;
        }, {} as Record<string, number>);

      const expensesByCategory = transactions
        ?.filter(t => t.type === 'expense')
        .reduce((acc, t) => {
          const categoryName = t.category?.name || 'Uncategorized';
          acc[categoryName] = (acc[categoryName] || 0) + Number(t.amount);
          return acc;
        }, {} as Record<string, number>);

      // Get active budgets count
      const { data: activeBudgets, error: budgetsError } = await supabase
        .from('budgets')
        .select('id')
        .eq('tenant_id', currentTenant?.id)
        .gte('end_date', format(today, 'yyyy-MM-dd'))
        .lte('start_date', format(today, 'yyyy-MM-dd'));

      if (budgetsError) throw budgetsError;

      return {
        monthlyIncome,
        monthlyExpenses,
        activeBudgets: activeBudgets?.length || 0,
        incomeByCategory,
        expensesByCategory,
      };
    },
    enabled: !!currentTenant?.id,
  });

  const isLoading = trendsLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const cards = [
    {
      name: 'Monthly Income',
      value: formatCurrency(stats?.monthlyIncome || 0, currency),
      icon: <TrendingUp className="text-emerald-500" />,
      color: 'bg-emerald-100 dark:bg-emerald-900/50',
      trend: monthlyTrends?.[monthlyTrends.length - 1]?.percentageChange
    },
    {
      name: 'Monthly Expenses',
      value: formatCurrency(stats?.monthlyExpenses || 0, currency),
      icon: <TrendingDown className="text-rose-500" />,
      color: 'bg-rose-100 dark:bg-rose-900/50',
      description: "Total expenses this month"
    },
    {
      name: 'Net Balance',
      value: formatCurrency((stats?.monthlyIncome || 0) - (stats?.monthlyExpenses || 0), currency),
      icon: <DollarSign className="text-blue-500" />,
      color: 'bg-blue-100 dark:bg-blue-900/50',
      description: "Net balance this month"
    },
    {
      name: 'Active Budgets',
      value: stats?.activeBudgets || 0,
      icon: <PiggyBank className="text-violet-500" />,
      color: 'bg-violet-100 dark:bg-violet-900/50',
      description: "Currently active budgets"
    }
  ];

  // Prepare chart data
  const monthlyTrendsChartData = {
    series: [
      {
        name: 'Income',
        data: monthlyTrends?.map(m => m.income) || []
      },
      {
        name: 'Expenses',
        data: monthlyTrends?.map(m => m.expenses) || []
      }
    ],
    options: {
      chart: {
        type: 'area',
        stacked: false,
        height: 350,
        toolbar: {
          show: false
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: [2, 2]
      },
      xaxis: {
        categories: monthlyTrends?.map(m => m.month) || [],
        labels: {
          style: {
            colors: 'hsl(var(--muted-foreground))'
          }
        }
      },
      yaxis: {
        labels: {
          formatter: (value: number) => formatCurrency(value, currency),
          style: {
            colors: 'hsl(var(--muted-foreground))'
          }
        }
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.2,
          stops: [0, 90, 100]
        }
      },
      tooltip: {
        y: {
          formatter: (value: number) => formatCurrency(value, currency)
        }
      }
    }
  };

  const incomeCategoryChartData = {
    series: Object.values(stats?.incomeByCategory || {}),
    options: {
      chart: {
        type: 'donut',
      },
      labels: Object.keys(stats?.incomeByCategory || {}),
      legend: {
        position: 'bottom',
        labels: {
          colors: 'hsl(var(--foreground))'
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (value: number) => `${value.toFixed(2)}%`
      },
      tooltip: {
        y: {
          formatter: (value: number) => formatCurrency(value, currency)
        }
      }
    }
  };

  const expenseCategoryChartData = {
    series: Object.values(stats?.expensesByCategory || {}),
    options: {
      chart: {
        type: 'donut',
      },
      labels: Object.keys(stats?.expensesByCategory || {}),
      legend: {
        position: 'bottom',
        labels: {
          colors: 'hsl(var(--foreground))'
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (value: number) => `${value.toFixed(2)}%`
      },
      tooltip: {
        y: {
          formatter: (value: number) => formatCurrency(value, currency)
        }
      }
    }
  };

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-foreground">Finances</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage church finances, track income and expenses, and monitor budgets.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex flex-wrap gap-3 items-center justify-end">
          <SubscriptionGate type="transaction">
            <Link to="/finances/transactions/add">
              <Button
                variant="default"
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            </Link>
          </SubscriptionGate>

          <DropdownButton
            variant="default"
            icon={<Upload className="h-4 w-4" />}
            items={[
              {
                label: 'Bulk Transaction Entry',
                icon: <Layers className="h-4 w-4" />,
                onClick: () => navigate('/finances/transactions/bulk')
              },
              {
                label: 'Bulk Income Entry',
                icon: <TrendingUp className="h-4 w-4" />,
                onClick: () => navigate('/finances/transactions/bulk-income')
              },
              {
                label: 'Bulk Expense Entry',
                icon: <TrendingDown className="h-4 w-4" />,
                onClick: () => navigate('/finances/transactions/bulk-expense')
              }
            ]}
          >
            Bulk Entry
          </DropdownButton>

          <div className="flex gap-3">
            <Link to="/finances/budgets/add">
              <Button
                variant="outline"
                className="flex items-center"
              >
                <PiggyBank className="h-4 w-4 mr-2" />
                Add Budget
              </Button>
            </Link>
            <Link to="/finances/reports">
              <Button
                variant="outline"
                className="flex items-center"
              >
                <FileText className="h-4 w-4 mr-2" />
                Reports
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card 
            key={card.name} 
            className="overflow-hidden hover:shadow-lg transition-shadow duration-200"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className={`${card.color} p-2 rounded-lg`}>
                  {card.icon}
                </div>
                {card.trend !== undefined && (
                  <Badge
                    variant={card.trend >= 0 ? 'success' : 'destructive'}
                    className="flex items-center space-x-1"
                  >
                    {card.trend >= 0 ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    <span>{Math.abs(card.trend).toFixed(1)}%</span>
                  </Badge>
                )}
              </div>
              <div className="mt-2">
                <p className="text-2xl font-semibold text-foreground">
                  {card.value}
                </p>
                <p className="text-sm text-muted-foreground">
                  {card.name}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly Trends Chart */}
      <Card className="mt-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <LineChart className="h-5 w-5 text-muted-foreground mr-2" />
              <h3 className="text-base font-medium text-foreground">
                Monthly Income vs Expenses
              </h3>
            </div>
            <Badge variant="secondary">Last 12 Months</Badge>
          </div>
          <Charts
            type="area"
            series={monthlyTrendsChartData.series}
            options={monthlyTrendsChartData.options}
            height={350}
          />
        </CardContent>
      </Card>

      {/* Category Distribution Charts */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Income Categories */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <PieChart className="h-5 w-5 text-emerald-500 mr-2" />
                <h3 className="text-base font-medium text-foreground">
                  Income Distribution
                </h3>
              </div>
            </div>
            <Charts
              type="donut"
              series={incomeCategoryChartData.series}
              options={incomeCategoryChartData.options}
              height={350}
            />
          </CardContent>
        </Card>

        {/* Expense Categories */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <PieChart className="h-5 w-5 text-rose-500 mr-2" />
                <h3 className="text-base font-medium text-foreground">
                  Expense Distribution
                </h3>
              </div>
            </div>
            <Charts
              type="donut"
              series={expenseCategoryChartData.series}
              options={expenseCategoryChartData.options}
              height={350}
            />
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <Card className="mt-6">
        <CardContent className="p-4">
          <div className="flex items-center mb-4">
            <BarChart3 className="h-5 w-5 text-muted-foreground mr-2" />
            <h3 className="text-base font-medium text-foreground">
              Financial Summary
            </h3>
          </div>
          
          <div className="space-y-4">
            {/* Monthly Balance */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Monthly Balance</span>
                <span className={stats?.monthlyIncome - stats?.monthlyExpenses >= 0 
                  ? 'text-success' 
                  : 'text-destructive'
                }>
                  {formatCurrency(Math.abs(stats?.monthlyIncome - stats?.monthlyExpenses), currency)}
                  {stats?.monthlyIncome - stats?.monthlyExpenses < 0 && ' (Deficit)'}
                </span>
              </div>
              <Progress
                value={(stats?.monthlyIncome / (stats?.monthlyExpenses || 1)) * 100}
                variant={stats?.monthlyIncome >= stats?.monthlyExpenses ? 'success' : 'destructive'}
                className="bg-gradient-to-r from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30"
              />
            </div>

            {/* Monthly Stats */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 rounded-xl p-4">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Monthly Income
                </h4>
                <p className="mt-2 text-2xl font-semibold text-success">
                  {formatCurrency(stats?.monthlyIncome || 0, currency)}
                </p>
                <p className="mt-1 text-sm text-success/70">
                  Total income this month
                </p>
              </div>

              <div className="bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-900/10 dark:to-red-900/10 rounded-xl p-4">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Monthly Expenses
                </h4>
                <p className="mt-2 text-2xl font-semibold text-destructive">
                  {formatCurrency(stats?.monthlyExpenses || 0, currency)}
                </p>
                <p className="mt-1 text-sm text-destructive/70">
                  Total expenses this month
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center mb-4">
              <Calendar className="h-5 w-5 text-muted-foreground mr-2" />
              <h3 className="text-base font-medium text-foreground">Quick Links</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link to="/finances/transactions">
                <Card className="hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-4 flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <DollarSign className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground">Transactions</h4>
                      <p className="text-xs text-muted-foreground">View all financial records</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/finances/budgets">
                <Card className="hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-4 flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <PiggyBank className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground">Budgets</h4>
                      <p className="text-xs text-muted-foreground">Manage budget allocations</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/finances/reports">
                <Card className="hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-4 flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground">Reports</h4>
                      <p className="text-xs text-muted-foreground">Generate financial reports</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/finances/transactions/bulk">
                <Card className="hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-4 flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <Layers className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground">Bulk Entry</h4>
                      <p className="text-xs text-muted-foreground">Enter multiple transactions</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center mb-4">
              <DollarSign className="h-5 w-5 text-muted-foreground mr-2" />
              <h3 className="text-base font-medium text-foreground">Bulk Operations</h3>
            </div>
            <div className="space-y-4">
              <Link to="/finances/transactions/bulk">
                <Card className="hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Layers className="h-6 w-6 text-primary" />
                      <div>
                        <h4 className="text-sm font-medium text-foreground">Bulk Transaction Entry</h4>
                        <p className="text-xs text-muted-foreground">Enter multiple transactions at once</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
              <Link to="/finances/transactions/bulk-income">
                <Card className="hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="h-6 w-6 text-success" />
                      <div>
                        <h4 className="text-sm font-medium text-foreground">Bulk Income Entry</h4>
                        <p className="text-xs text-muted-foreground">Record multiple income transactions</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
              <Link to="/finances/transactions/bulk-expense">
                <Card className="hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <TrendingDown className="h-6 w-6 text-destructive" />
                      <div>
                        <h4 className="text-sm font-medium text-foreground">Bulk Expense Entry</h4>
                        <p className="text-xs text-muted-foreground">Record multiple expense transactions</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default FinancesDashboard;