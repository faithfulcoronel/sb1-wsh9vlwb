import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import {
  Calendar,
  Filter,
  Search,
  FileText,
  Settings,
  Loader2,
  History,
  Users,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Pencil,
  Trash2,
} from 'lucide-react';

type DateRange = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

type AuditLogEntry = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  changes: Record<string, any>;
  created_at: string;
  performed_by: string;
  user_email: string;
  user_metadata: {
    first_name?: string;
    last_name?: string;
  };
};

function AuditLog() {
  const [dateRange, setDateRange] = useState<DateRange>('monthly');
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Get current tenant
  const { data: tenant } = useQuery({
    queryKey: ['current-tenant'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_current_tenant');
      if (error) throw error;
      return data?.[0];
    },
  });

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

  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['audit-logs', dateRange, startDate, endDate, actionFilter, entityFilter, tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];

      const { start, end } = getDateRange(dateRange);
      const startDateStr = format(start, 'yyyy-MM-dd');
      const endDateStr = format(end, 'yyyy-MM-dd');

      const { data, error } = await supabase.rpc('get_audit_logs', {
        p_start_date: startDateStr,
        p_end_date: endDateStr,
        p_action: actionFilter === 'all' ? null : actionFilter,
        p_entity_type: entityFilter === 'all' ? null : entityFilter
      });

      if (error) throw error;
      return data as AuditLogEntry[];
    },
    enabled: !!tenant?.id,
  });

  const filteredLogs = auditLogs?.filter(log => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(searchLower) ||
      log.entity_type.toLowerCase().includes(searchLower) ||
      log.entity_id.toLowerCase().includes(searchLower) ||
      log.user_email.toLowerCase().includes(searchLower) ||
      JSON.stringify(log.changes).toLowerCase().includes(searchLower)
    );
  });

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    if (range !== 'custom') {
      const { start, end } = getDateRange(range);
      setStartDate(format(start, 'yyyy-MM-dd'));
      setEndDate(format(end, 'yyyy-MM-dd'));
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return <FileText className="h-4 w-4 text-success" />;
      case 'update':
        return <Pencil className="h-4 w-4 text-info" />;
      case 'delete':
        return <Trash2 className="h-4 w-4 text-danger" />;
      default:
        return <History className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'create':
        return 'success';
      case 'update':
        return 'info';
      case 'delete':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'member':
        return <Users className="h-4 w-4 text-primary" />;
      case 'transaction':
        return <FileText className="h-4 w-4 text-success" />;
      case 'budget':
        return <FileText className="h-4 w-4 text-info" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-base font-semibold leading-7 text-gray-900">Audit Log</h2>
        <p className="mt-1 text-sm leading-6 text-gray-500">
          Track all changes and activities in your church administration system.
        </p>
      </div>

      <Card>
        {/* Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Select
                label="Date Range"
                value={dateRange}
                onChange={(e) => handleDateRangeChange(e.target.value as DateRange)}
                icon={<Calendar />}
                options={[
                  { value: 'daily', label: 'Today' },
                  { value: 'weekly', label: 'This Week' },
                  { value: 'monthly', label: 'This Month' },
                  { value: 'yearly', label: 'This Year' },
                  { value: 'custom', label: 'Custom Range' },
                ]}
              />
            </div>

            {dateRange === 'custom' && (
              <div className="sm:col-span-2">
                <div className="flex space-x-4">
                  <Input
                    type="date"
                    label="Start Date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    icon={<Calendar />}
                  />
                  <Input
                    type="date"
                    label="End Date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    icon={<Calendar />}
                  />
                </div>
              </div>
            )}

            <div>
              <Select
                label="Action"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                icon={<Filter />}
                options={[
                  { value: 'all', label: 'All Actions' },
                  { value: 'create', label: 'Create' },
                  { value: 'update', label: 'Update' },
                  { value: 'delete', label: 'Delete' },
                ]}
              />
            </div>

            <div>
              <Select
                label="Entity Type"
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                icon={<Filter />}
                options={[
                  { value: 'all', label: 'All Entities' },
                  { value: 'member', label: 'Members' },
                  { value: 'transaction', label: 'Transactions' },
                  { value: 'budget', label: 'Budgets' },
                ]}
              />
            </div>

            <div>
              <Input
                label="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search />}
                placeholder="Search logs..."
                clearable
                onClear={() => setSearchTerm('')}
              />
            </div>
          </div>
        </div>

        {/* Audit Log List */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredLogs && filteredLogs.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Entity</TableCell>
                <TableCell>Changes</TableCell>
                <TableCell>Performed By</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {format(new Date(log.created_at), 'MMM d, yyyy HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getActionIcon(log.action)}
                      <Badge variant={getActionBadgeVariant(log.action)}>
                        {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getEntityIcon(log.entity_type)}
                      <span className="font-medium">
                        {log.entity_type.charAt(0).toUpperCase() + log.entity_type.slice(1)}
                      </span>
                      <span className="text-gray-500 text-sm">{log.entity_id}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-md">
                      {Object.entries(log.changes).map(([key, value]) => (
                        <div key={key} className="text-sm">
                          <span className="font-medium">{key}:</span>{' '}
                          <span className="text-gray-600">
                            {JSON.stringify(value, null, 2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.user_metadata?.first_name
                      ? `${log.user_metadata.first_name} ${log.user_metadata.last_name}`
                      : log.user_email}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12">
            <History className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No audit logs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || actionFilter !== 'all' || entityFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No activities have been logged yet'}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

export default AuditLog;