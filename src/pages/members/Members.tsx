import React, { useState } from 'react';
import { Link, Routes, Route, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { useMessageStore } from '../../components/MessageHandler';
import { Card, CardHeader, CardContent } from '../../components/ui2/card';
import { Button } from '../../components/ui2/button';
import { Input } from '../../components/ui2/input';
import { Select } from '../../components/ui2/select';
import { Badge } from '../../components/ui2/badge';
import { Tabs } from '../../components/ui2/tabs';
import { Avatar } from '../../components/ui2/avatar';
import { Pagination } from '../../components/ui2/pagination';
import { SubscriptionGate } from '../../components/SubscriptionGate';
import MemberProfile from './MemberProfile';
import MemberEdit from './MemberEdit';
import MemberAdd from './MemberAdd';
import {
  Plus,
  Search,
  Filter,
  Users,
  UserCheck,
  UserMinus,
  UserPlus,
  Calendar,
  ChevronRight,
  Loader2,
} from 'lucide-react';

type Member = {
  id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  preferred_name?: string;
  contact_number: string;
  address: string;
  email?: string;
  envelope_number?: string;
  membership_category_id: string;
  status_category_id: string;
  membership_date: string | null;
  birthday: string | null;
  profile_picture_url: string | null;
  leadership_position?: string;
  deleted_at: string | null;
};

type Category = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_system: boolean;
  is_active: boolean;
  sort_order: number;
};

function MemberList() {
  const navigate = useNavigate();
  const { addMessage } = useMessageStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Get current tenant
  const { data: currentTenant } = useQuery({
    queryKey: ['current-tenant'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_current_tenant');
      if (error) throw error;
      return data?.[0];
    },
  });

  // Get members
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['members', currentTenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('tenant_id', currentTenant?.id)
        .is('deleted_at', null)
        .order('last_name', { ascending: true });

      if (error) throw error;
      return data as Member[];
    },
    enabled: !!currentTenant?.id,
  });

  // Get status categories
  const { data: statusCategories } = useQuery({
    queryKey: ['categories', 'member_status', currentTenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('tenant_id', currentTenant?.id)
        .eq('is_active', true)
        .eq('type', 'member_status')
        .is('deleted_at', null)
        .order('sort_order');

      if (error) throw error;
      return data as Category[];
    },
    enabled: !!currentTenant?.id,
  });

  const getStatusCategory = (statusId: string) => {
    return statusCategories?.find(c => c.id === statusId)?.name || 'Unknown';
  };

  const getStatusColor = (statusId: string) => {
    const status = statusCategories?.find(c => c.id === statusId)?.code;
    const statusColors: Record<string, string> = {
      active: 'success',
      inactive: 'secondary',
      under_discipline: 'destructive',
      regular_attender: 'info',
      visitor: 'warning',
      withdrawn: 'warning',
      removed: 'destructive',
      donor: 'primary'
    };

    return statusColors[status || ''] || 'secondary';
  };

  const tabs = [
    { 
      id: 'all', 
      label: 'All Members', 
      icon: <Users className="h-5 w-5" />, 
      filter: () => true 
    },
    { 
      id: 'active', 
      label: 'Active', 
      icon: <UserCheck className="h-5 w-5" />, 
      filter: (m: Member) => statusCategories?.find(c => c.id === m.status_category_id)?.code === 'active'
    },
    { 
      id: 'inactive', 
      label: 'Inactive', 
      icon: <UserMinus className="h-5 w-5" />, 
      filter: (m: Member) => statusCategories?.find(c => c.id === m.status_category_id)?.code === 'inactive'
    },
    { 
      id: 'new', 
      label: 'New Members', 
      icon: <UserPlus className="h-5 w-5" />, 
      filter: (m: Member) => {
        if (!m.membership_date) return false;
        const joinDate = new Date(m.membership_date);
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        return joinDate >= threeMonthsAgo;
      }
    },
    { 
      id: 'birthdays', 
      label: 'Birthdays', 
      icon: <Calendar className="h-5 w-5" />, 
      filter: (m: Member) => {
        if (!m.birthday) return false;
        const birthday = new Date(m.birthday);
        const today = new Date();
        return birthday.getMonth() === today.getMonth();
      }
    },
  ];

  const [activeTab, setActiveTab] = useState(tabs[0].id);

  // Filter members based on search, status, and active tab
  const filteredMembers = members?.filter((member) => {
    if (!member) return false;

    // Apply tab filter
    const activeTabFilter = tabs.find(tab => tab.id === activeTab)?.filter;
    if (!activeTabFilter?.(member)) return false;

    // Apply search filter
    const matchesSearch = 
      (member.first_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (member.last_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (member.preferred_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (member.contact_number || '').includes(searchTerm);
    
    // Apply status filter
    const matchesStatus = statusFilter === 'all' || member.status_category_id === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate pagination
  const totalItems = filteredMembers?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMembers = filteredMembers?.slice(startIndex, endIndex);

  // Calculate counts for each tab
  const tabsWithCounts = tabs.map(tab => ({
    ...tab,
    badge: members?.filter(tab.filter).length || 0,
  }));

  if (membersLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-foreground">Members</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              A list of all church members including their contact information and membership status.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <SubscriptionGate type="member">
              <Button
                variant="default"
                onClick={() => navigate('/members/add')}
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </SubscriptionGate>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6">
          <Tabs
            tabs={tabsWithCounts}
            activeTab={activeTab}
            onChange={setActiveTab}
            variant="enclosed"
            size="sm"
          />
        </div>

        {/* Filters */}
        <div className="mt-6 sm:flex sm:items-center sm:justify-between">
          <div className="relative max-w-xs">
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search />}
            />
          </div>

          <div className="mt-4 sm:mt-0">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              icon={<Filter />}
              options={[
                { value: 'all', label: 'All Statuses' },
                ...(statusCategories?.map(category => ({
                  value: category.id,
                  label: category.name
                })) || [])
              ]}
            />
          </div>
        </div>
      </div>

      {/* Member Grid */}
      {filteredMembers && filteredMembers.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedMembers?.map((member) => (
              <Card
                key={member.id}
                className="group relative overflow-visible hover:shadow-lg transition-shadow duration-200"
                onClick={() => navigate(`/members/${member.id}`)}
              >
                <CardContent className="p-4">
                  {/* Member Photo and Basic Info */}
                  <div className="flex items-center space-x-4">
                    {member.profile_picture_url ? (
                      <Avatar
                        src={member.profile_picture_url}
                        alt={`${member.first_name} ${member.last_name}`}
                        className="h-16 w-16 rounded-full object-cover bg-muted ring-4 ring-background group-hover:ring-primary/5"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-background group-hover:ring-primary/5">
                        <span className="text-primary font-medium text-xl">
                          {member.first_name[0]}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {member.preferred_name 
                          ? member.preferred_name 
                          : `${member.last_name}, ${member.first_name}`
                        }
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {member.contact_number}
                      </p>
                    </div>
                  </div>

                  {/* Member Details */}
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {member.address}
                    </p>
                  </div>

                  {/* Status Badges */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge
                      variant={getStatusColor(member.status_category_id)}
                      className="transition-all duration-200 group-hover:scale-105"
                    >
                      {getStatusCategory(member.status_category_id)}
                    </Badge>
                    {member.leadership_position && (
                      <Badge 
                        variant="info"
                        className="transition-all duration-200 group-hover:scale-105"
                      >
                        {member.leadership_position}
                      </Badge>
                    )}
                  </div>

                  {/* Membership Date */}
                  <div className="mt-4 text-sm text-muted-foreground flex items-center">
                    <Calendar className="h-4 w-4 mr-1.5" />
                    {member.membership_date 
                      ? `Member since ${format(new Date(member.membership_date), 'MMM d, yyyy')}`
                      : 'No membership date'}
                  </div>

                  {/* Visual Indicator for Card Clickability */}
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <div className="bg-primary text-primary-foreground rounded-full p-1 shadow-lg">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
              onItemsPerPageChange={setItemsPerPage}
              variant="outline"
              size="sm"
            />
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              {searchTerm || statusFilter !== 'all'
                ? 'No members found matching your search criteria'
                : 'No members found. Add your first member by clicking the "Add Member" button above.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Members() {
  return (
    <Routes>
      <Route index element={<MemberList />} />
      <Route path="add" element={<MemberAdd />} />
      <Route path=":id" element={<MemberProfile />} />
      <Route path=":id/edit" element={<MemberEdit />} />
    </Routes>
  );
}

export default Members;