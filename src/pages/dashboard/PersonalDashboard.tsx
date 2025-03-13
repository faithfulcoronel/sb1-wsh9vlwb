import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { format, subMonths, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { useCurrencyStore } from '../../stores/currencyStore';
import { formatCurrency } from '../../utils/currency';
import { useAuthStore } from '../../stores/authStore';
import { Card, CardHeader, CardContent } from '../../components/ui2/card';
import { Progress } from '../../components/ui2/progress';
import { Badge } from '../../components/ui2/badge';
import { Charts } from '../../components/ui2/charts';
import { ScrollArea } from '../../components/ui2/scroll-area';
import { Separator } from '../../components/ui2/separator';
import WelcomeGreeting from '../../components/WelcomeGreeting';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Loader2,
  ChevronUp,
  ChevronDown,
  PieChart,
  BarChart3,
  LineChart,
  Target,
  Award,
} from 'lucide-react';

function PersonalDashboard() {
  const { currency } = useCurrencyStore();
  const { user } = useAuthStore();

  // Get current tenant
  const { data: currentTenant } = useQuery({
    queryKey: ['current-tenant'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_current_tenant');
      if (error) throw error;
      return data?.[0];
    },
  });
  
  // Get associated member data
  const { data: memberData } = useQuery({
    queryKey: ['current-user-member', user?.email, currentTenant?.id],
    queryFn: async () => {
      if (!user?.email) return null;

      const { data, error } = await supabase
        .from('members')
        .select('id, first_name, last_name')
        .eq('tenant_id', currentTenant?.id)
        .eq('email', user.email)
        .is('deleted_at', null)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.email,
  });

  // Get personal monthly trends
  const { data: monthlyTrends, isLoading: trendsLoading } = useQuery({
    queryKey: ['personal-monthly-trends', memberData?.id, currentTenant?.id],
    queryFn: async () => {
      if (!memberData?.id) throw new Error('Member not found');

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
            .eq('member_id', memberData.id)
            .gte('date', format(startOfDay(start), 'yyyy-MM-dd'))
            .lte('date', format(endOfDay(end), 'yyyy-MM-dd'));

          if (error) throw error;

          const contributions = transactions
            ?.filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

          const previousMonth = subMonths(start, 1);
          const { data: prevTransactions } = await supabase
            .from('financial_transactions')
            .select('type, amount')
            .eq('tenant_id', currentTenant?.id)
            .eq('member_id', memberData.id)
            .gte('date', format(startOfDay(startOfMonth(previousMonth)), 'yyyy-MM-dd'))
            .lte('date', format(endOfDay(endOfMonth(previousMonth)), 'yyyy-MM-dd'))
            .eq('type', 'income');

          const previousContributions = prevTransactions
            ?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

          const percentageChange = previousContributions === 0 
            ? 100 
            : ((contributions - previousContributions) / previousContributions) * 100;

          return {
            month,
            contributions,
            percentageChange,
          };
        })
      );

      return monthlyData;
    },
    enabled: !!memberData?.id,
  });

  // Get personal contribution statistics
  const { data: contributionStats, isLoading: statsLoading } = useQuery({
    queryKey: ['personal-contribution-stats', memberData?.id,  currentTenant?.id],
    queryFn: async () => {
      if (!memberData?.id) throw new Error('Member not found');

      const today = new Date();
      const startOfYear = startOfMonth(new Date(today.getFullYear(), 0, 1));
      const endOfYear = endOfMonth(new Date(today.getFullYear(), 11, 31));
      const firstDayOfMonth = startOfMonth(today);
      const lastDayOfMonth = endOfMonth(today);

      // Get yearly contributions
      const { data: yearlyTransactions, error: yearlyError } = await supabase
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
        .eq('member_id', memberData.id)
        .eq('type', 'income')
        .gte('date', format(startOfDay(startOfYear), 'yyyy-MM-dd'))
        .lte('date', format(endOfDay(endOfYear), 'yyyy-MM-dd'));

      if (yearlyError) throw yearlyError;

      // Get monthly contributions
      const { data: monthlyTransactions, error: monthlyError } = await supabase
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
        .eq('member_id', memberData.id)
        .eq('type', 'income')
        .gte('date', format(startOfDay(firstDayOfMonth), 'yyyy-MM-dd'))
        .lte('date', format(endOfDay(lastDayOfMonth), 'yyyy-MM-dd'));

      if (monthlyError) throw monthlyError;

      // Calculate category breakdowns
      const categoryTotals = yearlyTransactions?.reduce((acc, t) => {
        const categoryName = t.category?.name || 'Uncategorized';
        acc[categoryName] = (acc[categoryName] || 0) + Number(t.amount);
        return acc;
      }, {} as Record<string, number>);

      const sortedCategories = Object.entries(categoryTotals || {})
        .sort(([, a], [, b]) => b - a);

      const yearlyTotal = yearlyTransactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const monthlyTotal = monthlyTransactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Calculate average contribution
      const averageContribution = yearlyTransactions?.length 
        ? yearlyTotal / yearlyTransactions.length 
        : 0;

      return {
        yearlyTotal,
        monthlyTotal,
        averageContribution,
        categoryBreakdown: sortedCategories,
      };
    },
    enabled: !!memberData?.id,
  });

  const isLoading = trendsLoading || statsLoading || !memberData;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!memberData) {
    return (
      <Card className="text-center py-8">
        <h3 className="text-lg font-medium text-foreground">
          No Member Account Found
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Your user account is not associated with any member profile.
          Please contact an administrator to link your account to your member profile.
        </p>
      </Card>
    );
  }

  const cards = [
    {
      name: 'Monthly Contributions',
      value: formatCurrency(contributionStats?.monthlyTotal || 0, currency),
      icon: <TrendingUp className="text-emerald-500" />,
      color: 'bg-emerald-100 dark:bg-emerald-900/50',
      trend: monthlyTrends?.[monthlyTrends.length - 1]?.percentageChange
    },
    {
      name: 'Yearly Contributions',
      value: formatCurrency(contributionStats?.yearlyTotal || 0, currency),
      icon: <Target className="text-blue-500" />,
      color: 'bg-blue-100 dark:bg-blue-900/50',
      description: "Total contributions this year"
    },
    {
      name: 'Average Contribution',
      value: formatCurrency(contributionStats?.averageContribution || 0, currency),
      icon: <Award className="text-violet-500" />,
      color: 'bg-violet-100 dark:bg-violet-900/50',
      description: "Average per contribution"
    }
  ];

  // Prepare chart data
  const contributionChartData = {
    series: [{
      name: 'Contributions',
      data: monthlyTrends?.map(m => m.contributions) || []
    }],
    options: {
      chart: {
        type: 'area',
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
        width: 2
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

  // Calculate total for percentages
  const totalContributions = contributionStats?.categoryBreakdown.reduce((sum, [, amount]) => sum + amount, 0) || 0;

  const categoryChartData = {
    series: contributionStats?.categoryBreakdown.map(([, amount]) => amount) || [],
    options: {
      chart: {
        type: 'donut',
      },
      labels: contributionStats?.categoryBreakdown.map(([category]) => category) || [],
      legend: {
        position: 'bottom',
        labels: {
          colors: 'hsl(var(--foreground))'
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (value: number) => {
          const percentage = ((value / totalContributions) * 100).toFixed(1);
          return `${percentage}%`;
        }
      },
      tooltip: {
        y: {
          formatter: (value: number) => {
            const percentage = ((value / totalContributions) * 100).toFixed(1);
            return `${formatCurrency(value, currency)} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <div className="space-y-6">

      {/* Welcome Greeting */}
      <WelcomeGreeting />
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Monthly Contribution Trends */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <LineChart className="h-5 w-5 text-muted-foreground mr-2" />
                <h3 className="text-base font-medium text-foreground">
                  Monthly Contribution Trends
                </h3>
              </div>
              <Badge variant="secondary">Last 12 Months</Badge>
            </div>
            <Charts
              type="area"
              series={contributionChartData.series}
              options={contributionChartData.options}
              height={350}
            />
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <PieChart className="h-5 w-5 text-muted-foreground mr-2" />
                <h3 className="text-base font-medium text-foreground">
                  Contribution Categories
                </h3>
              </div>
            </div>
            <Charts
              type="donut"
              series={categoryChartData.series}
              options={categoryChartData.options}
              height={350}
            />
          </CardContent>
        </Card>
      </div>

      {/* Contribution Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center mb-4">
            <BarChart3 className="h-5 w-5 text-muted-foreground mr-2" />
            <h3 className="text-base font-medium text-foreground">
              Contribution Summary
            </h3>
          </div>
          
          <div className="space-y-6">
            {/* Year-to-Date Progress */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">
                  Year-to-Date Progress
                </span>
                <span className="font-medium text-foreground">
                  {formatCurrency(contributionStats?.yearlyTotal || 0, currency)}
                </span>
              </div>
              <Progress
                value={100}
                variant="success"
                className="bg-gradient-to-r from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30"
              />
            </div>

            {/* Monthly Stats */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 rounded-xl p-4">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Current Month
                </h4>
                <p className="mt-2 text-2xl font-semibold text-success">
                  {formatCurrency(contributionStats?.monthlyTotal || 0, currency)}
                </p>
                <p className="mt-1 text-sm text-success/70">
                  Total contributions this month
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-xl p-4">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Average Per Contribution
                </h4>
                <p className="mt-2 text-2xl font-semibold text-primary">
                  {formatCurrency(contributionStats?.averageContribution || 0, currency)}
                </p>
                <p className="mt-1 text-sm text-primary/70">
                  Average contribution amount
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PersonalDashboard;