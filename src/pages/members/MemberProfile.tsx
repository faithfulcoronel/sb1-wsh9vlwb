import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { useCurrencyStore } from '../../stores/currencyStore';
import { formatCurrency } from '../../utils/currency';
import { useMessageStore } from '../../components/MessageHandler';
import { Card, CardHeader, CardContent } from '../../components/ui2/card';
import { Button } from '../../components/ui2/button';
import { Badge } from '../../components/ui2/badge';
import { ImageInput } from '../../components/ui2/image-input';
import { Tabs } from '../../components/ui2/tabs';
import { Separator } from '../../components/ui2/separator';
import { ScrollArea } from '../../components/ui2/scroll-area';
import {
  User,
  Phone,
  MapPin,
  Mail,
  Calendar,
  Heart,
  Gift,
  UserPlus,
  Home,
  Briefcase,
  Users,
  Cake,
  Loader2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Edit2,
  ArrowLeft,
} from 'lucide-react';

type Member = {
  id: uuid;
  first_name: string;
  last_name: string;
  middle_name?: string;
  preferred_name?: string;
  contact_number: string;
  address: string;
  email?: string;
  envelope_number?: string;
  membership_category_id: uuid;
  status_category_id: uuid;
  membership_date: string | null;
  birthday: string | null;
  profile_picture_url: string | null;
  tenant_id: uuid;
  created_by: uuid;
  updated_by: uuid;
  deleted_at: string | null;
  gender?: 'male' | 'female' | 'other';
  marital_status?: 'single' | 'married' | 'widowed' | 'divorced';
  baptism_date?: string;
  spiritual_gifts?: string[];
  ministry_interests?: string[];
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  leadership_position?: string;
  small_groups?: string[];
  ministries?: string[];
  volunteer_roles?: string[];
  attendance_rate?: number;
  last_attendance_date?: string;
  pastoral_notes?: string;
  prayer_requests?: string[];
};

type Transaction = {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  member_id: string;
  tenant_id: string;
};

type Category = {
  id: uuid;
  code: string;
  name: string;
  description: string | null;
  is_system: boolean;
  is_active: boolean;
  sort_order: number;
};

function MemberProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currency } = useCurrencyStore();
  const { addMessage } = useMessageStore();

  // Get current tenant
  const { data: currentTenant } = useQuery({
    queryKey: ['current-tenant'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_current_tenant');
      if (error) throw error;
      return data?.[0];
    },
  });

  // Get member data
  const { data: member, isLoading: memberLoading } = useQuery({
    queryKey: ['member', id, currentTenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', currentTenant?.id)
        .single();

      if (error) throw error;
      return data as Member;
    },
    enabled: !!id && !!currentTenant?.id,
  });

  // Get membership categories
  const { data: categories } = useQuery({
    queryKey: ['categories', 'membership', currentTenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('tenant_id', currentTenant?.id)
        .eq('is_active', true)
        .eq('type', 'membership')
        .is('deleted_at', null)
        .order('sort_order');

      if (error) throw error;
      return data as Category[];
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

  // Get transactions for this member
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['member-transactions', id, currentTenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('member_id', id)
        .eq('tenant_id', currentTenant?.id)
        .order('date', { ascending: false });

      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!id && !!currentTenant?.id,
  });

  const getMembershipCategory = (categoryId: string) => {
    return categories?.find(c => c.id === categoryId)?.name || 'Unknown';
  };

  const getStatusCategory = (categoryId: string) => {
    return statusCategories?.find(c => c.id === categoryId)?.name || 'Unknown';
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
      id: 'overview',
      label: 'Overview',
      icon: <User className="h-5 w-5" />,
    },
    {
      id: 'ministry',
      label: 'Ministry',
      icon: <Heart className="h-5 w-5" />,
    },
    {
      id: 'financial',
      label: 'Financial',
      icon: <DollarSign className="h-5 w-5" />,
    },
  ];

  const [activeTab, setActiveTab] = useState('overview');

  if (memberLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!member) {
    return (
      <Card className="text-center py-8">
        <h3 className="text-lg font-medium text-foreground">Member not found</h3>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate('/members')}
        className="flex items-center"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Members
      </Button>

      {/* Member Profile Card */}
      <Card>
        <CardHeader className="relative">
          <div className="flex items-center">
            <div className="relative">
              <ImageInput
                value={member.profile_picture_url}
                onChange={() => {}}
                size="xl"
                shape="circle"
                className="ring-4 ring-background"
              />
            </div>
            <div className="ml-6">
              <h2 className="text-2xl font-bold text-foreground">
                {member.preferred_name || `${member.first_name} ${member.middle_name ? `${member.middle_name} ` : ''}${member.last_name}`}
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant={getStatusColor(member.status_category_id)}>
                  {getStatusCategory(member.status_category_id)}
                </Badge>
                <Badge variant="primary">
                  {getMembershipCategory(member.membership_category_id)}
                </Badge>
                {member.leadership_position && (
                  <Badge variant="info">
                    {member.leadership_position}
                  </Badge>
                )}
              </div>
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/members/${id}/edit`)}
                  className="flex items-center"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
            variant="enclosed"
            size="sm"
          />

          <div className="mt-6">
            <ScrollArea className="h-[calc(100vh-24rem)]">
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* Basic Information */}
                  <div>
                    <h4 className="text-lg font-medium text-foreground mb-4">Basic Information</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground flex items-center">
                          <User className="h-5 w-5 mr-2" />
                          Full Name
                        </dt>
                        <dd className="mt-1 text-sm text-foreground">
                          {member.first_name} {member.middle_name && `${member.middle_name} `}{member.last_name}
                          {member.preferred_name && (
                            <span className="ml-2 text-muted-foreground">
                              (Preferred: {member.preferred_name})
                            </span>
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-sm font-medium text-muted-foreground flex items-center">
                          <Users className="h-5 w-5 mr-2" />
                          Gender & Marital Status
                        </dt>
                        <dd className="mt-1 text-sm text-foreground">
                          {member.gender?.charAt(0).toUpperCase() + member.gender?.slice(1) || 'Not specified'}, {' '}
                          {member.marital_status?.charAt(0).toUpperCase() + member.marital_status?.slice(1) || 'Not specified'}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-sm font-medium text-muted-foreground flex items-center">
                          <Cake className="h-5 w-5 mr-2" />
                          Birthday
                        </dt>
                        <dd className="mt-1 text-sm text-foreground">
                          {member.birthday
                            ? format(new Date(member.birthday), 'MMMM d, yyyy')
                            : 'Not specified'}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-sm font-medium text-muted-foreground flex items-center">
                          <Calendar className="h-5 w-5 mr-2" />
                          Baptism Date
                        </dt>
                        <dd className="mt-1 text-sm text-foreground">
                          {member.baptism_date
                            ? format(new Date(member.baptism_date), 'MMMM d, yyyy')
                            : 'Not specified'}
                        </dd>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Contact Information */}
                  <div>
                    <h4 className="text-lg font-medium text-foreground mb-4">Contact Information</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground flex items-center">
                          <Phone className="h-5 w-5 mr-2" />
                          Contact Number
                        </dt>
                        <dd className="mt-1 text-sm text-foreground">{member.contact_number}</dd>
                      </div>

                      {member.email && (
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground flex items-center">
                            <Mail className="h-5 w-5 mr-2" />
                            Email Address
                          </dt>
                          <dd className="mt-1 text-sm text-foreground">{member.email}</dd>
                        </div>
                      )}

                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-muted-foreground flex items-center">
                          <MapPin className="h-5 w-5 mr-2" />
                          Address
                        </dt>
                        <dd className="mt-1 text-sm text-foreground">{member.address}</dd>
                      </div>

                      {member.emergency_contact_name && (
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-muted-foreground">Emergency Contact</dt>
                          <dd className="mt-1 text-sm text-foreground">
                            {member.emergency_contact_name} - {member.emergency_contact_phone}
                          </dd>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Church Information */}
                  <div>
                    <h4 className="text-lg font-medium text-foreground mb-4">Church Information</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground flex items-center">
                          <Users className="h-5 w-5 mr-2" />
                          Membership Status
                        </dt>
                        <dd className="mt-1 text-sm text-foreground">
                          {getStatusCategory(member.status_category_id)}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-sm font-medium text-muted-foreground flex items-center">
                          <Calendar className="h-5 w-5 mr-2" />
                          Membership Date
                        </dt>
                        <dd className="mt-1 text-sm text-foreground">
                          {member.membership_date
                            ? format(new Date(member.membership_date), 'MMMM d, yyyy')
                            : 'Not specified'}
                        </dd>
                      </div>

                      {member.envelope_number && (
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">
                            Envelope Number
                          </dt>
                          <dd className="mt-1 text-sm text-foreground">{member.envelope_number}</dd>
                        </div>
                      )}

                      {member.leadership_position && (
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground flex items-center">
                            <Briefcase className="h-5 w-5 mr-2" />
                            Leadership Position
                          </dt>
                          <dd className="mt-1 text-sm text-foreground">{member.leadership_position}</dd>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ministry' && (
                <div className="space-y-8">
                  {/* Ministry Information */}
                  <div>
                    <h4 className="text-lg font-medium text-foreground mb-4">Ministry Information</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {member.spiritual_gifts && member.spiritual_gifts.length > 0 && (
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground flex items-center">
                            <Gift className="h-5 w-5 mr-2" />
                            Spiritual Gifts
                          </dt>
                          <dd className="mt-1 text-sm text-foreground">
                            {member.spiritual_gifts.join(', ')}
                          </dd>
                        </div>
                      )}

                      {member.ministry_interests && member.ministry_interests.length > 0 && (
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground flex items-center">
                            <Heart className="h-5 w-5 mr-2" />
                            Ministry Interests
                          </dt>
                          <dd className="mt-1 text-sm text-foreground">
                            {member.ministry_interests.join(', ')}
                          </dd>
                        </div>
                      )}

                      {member.volunteer_roles && member.volunteer_roles.length > 0 && (
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground flex items-center">
                            <UserPlus className="h-5 w-5 mr-2" />
                            Volunteer Roles
                          </dt>
                          <dd className="mt-1 text-sm text-foreground">
                            {member.volunteer_roles.join(', ')}
                          </dd>
                        </div>
                      )}

                      {member.small_groups && member.small_groups.length > 0 && (
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground flex items-center">
                            <Users className="h-5 w-5 mr-2" />
                            Small Groups
                          </dt>
                          <dd className="mt-1 text-sm text-foreground">
                            {member.small_groups.join(', ')}
                          </dd>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Additional Notes */}
                  {(member.pastoral_notes || (member.prayer_requests && member.prayer_requests.length > 0)) && (
                    <div>
                      <h4 className="text-lg font-medium text-foreground mb-4">Additional Notes</h4>
                      <div className="grid grid-cols-1 gap-4">
                        {member.pastoral_notes && (
                          <div>
                            <dt className="text-sm font-medium text-muted-foreground">Pastoral Notes</dt>
                            <dd className="mt-1 text-sm text-foreground whitespace-pre-line">
                              {member.pastoral_notes}
                            </dd>
                          </div>
                        )}

                        {member.prayer_requests && member.prayer_requests.length > 0 && (
                          <div>
                            <dt className="text-sm font-medium text-muted-foreground">Prayer Requests</dt>
                            <dd className="mt-1 text-sm text-foreground">
                              <ul className="list-disc pl-5 space-y-1">
                                {member.prayer_requests.map((request, index) => (
                                  <li key={index}>{request}</li>
                                ))}
                              </ul>
                            </dd>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'financial' && (
                <div className="space-y-8">
                  {/* Financial Summary */}
                  <div>
                    <h4 className="text-lg font-medium text-foreground mb-4">Financial Summary</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <TrendingUp className="h-5 w-5 text-success" />
                              <h3 className="ml-2 text-sm font-medium text-foreground">Total Contributions</h3>
                            </div>
                            <Badge variant="success">YTD</Badge>
                          </div>
                          <p className="mt-2 text-2xl font-semibold text-foreground">
                            {formatCurrency(
                              transactions
                                ?.filter(t => t.type === 'income')
                                .reduce((sum, t) => sum + Number(t.amount), 0) || 0,
                              currency
                            )}
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <TrendingDown className="h-5 w-5 text-destructive" />
                              <h3 className="ml-2 text-sm font-medium text-foreground">Total Expenses</h3>
                            </div>
                            <Badge variant="destructive">YTD</Badge>
                          </div>
                          <p className="mt-2 text-2xl font-semibold text-foreground">
                            {formatCurrency(
                              transactions
                                ?.filter(t => t.type === 'expense')
                                .reduce((sum, t) => sum + Number(t.amount), 0) || 0,
                              currency
                            )}
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <DollarSign className="h-5 w-5 text-primary" />
                              <h3 className="ml-2 text-sm font-medium text-foreground">Average Contribution</h3>
                            </div>
                            <Badge variant="primary">Per Transaction</Badge>
                          </div>
                          <p className="mt-2 text-2xl font-semibold text-foreground">
                            {formatCurrency(
                              transactions?.filter(t => t.type === 'income').length
                                ? transactions
                                    ?.filter(t => t.type === 'income')
                                    .reduce((sum, t) => sum + Number(t.amount), 0) /
                                  transactions?.filter(t => t.type === 'income').length
                                : 0,
                              currency
                            )}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Separator />

                  {/* Transaction History */}
                  <div>
                    <h4 className="text-lg font-medium text-foreground mb-4">Transaction History</h4>
                    <div className="space-y-4">
                      {transactions?.map((transaction) => (
                        <Card key={transaction.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                {transaction.type === 'income' ? (
                                  <TrendingUp className="h-5 w-5 text-success" />
                                ) : (
                                  <TrendingDown className="h-5 w-5 text-destructive" />
                                )}
                                <div>
                                  <p className="text-sm font-medium text-foreground">
                                    {transaction.description}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {format(new Date(transaction.date), 'MMM d, yyyy')}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`text-sm font-medium ${
                                  transaction.type === 'income' 
                                    ? 'text-success' 
                                    : 'text-destructive'
                                }`}>
                                  {transaction.type === 'income' ? '+' : '-'}
                                  {formatCurrency(transaction.amount, currency)}
                                </p>
                                <Badge variant={transaction.type === 'income' ? 'success' : 'destructive'}>
                                  {transaction.category}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {(!transactions || transactions.length === 0) && (
                        <Card>
                          <CardContent className="p-8 text-center">
                            <p className="text-sm text-muted-foreground">
                              No transactions found
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default MemberProfile;