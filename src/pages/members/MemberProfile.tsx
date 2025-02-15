import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { useCurrencyStore } from '../../stores/currencyStore';
import { formatCurrency } from '../../utils/currency';
import { useEnumValues } from '../../hooks/useEnumValues';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/Pagination';
import {
  ArrowLeft,
  Upload,
  Loader2,
  AlertCircle,
  DollarSign,
  Calendar,
  User,
  Phone,
  MapPin,
  CheckCircle2,
  Cake,
  Mail,
  Filter,
  Search,
} from 'lucide-react';

type Member = {
  id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  contact_number: string;
  address: string;
  email?: string;
  envelope_number?: string;
  membership_type: string;
  status: string;
  membership_date: string | null;
  birthday: string | null;
  profile_picture_url: string | null;
};

type Transaction = {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
  created_at: string;
};

function MemberProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currency } = useCurrencyStore();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { membershipTypes, memberStatuses } = useEnumValues();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const { data: member, isLoading: memberLoading } = useQuery({
    queryKey: ['member', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Member;
    },
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['member-transactions', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('member_id', id)
        .order('date', { ascending: false });

      if (error) throw error;
      return data as Transaction[];
    },
  });

  const filteredTransactions = transactions?.filter((transaction) => {
    const matchesSearch = 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter;
    
    return matchesSearch && matchesType && matchesCategory;
  });

  const { 
    currentPage,
    itemsPerPage,
    totalPages,
    startIndex,
    endIndex,
    handlePageChange,
    handleItemsPerPageChange,
  } = usePagination({
    totalItems: filteredTransactions?.length || 0,
  });

  const paginatedTransactions = filteredTransactions?.slice(startIndex, endIndex);

  const categories = Array.from(
    new Set(transactions?.map((t) => t.category) || [])
  ).sort();

  const uploadProfilePicture = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}-${Math.random()}.${fileExt}`;
      const filePath = `${id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('members')
        .update({ profile_picture_url: publicUrl })
        .eq('id', id);

      if (updateError) throw updateError;

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member', id] });
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    },
    onError: (error: Error) => {
      setUploadError(error.message);
      setTimeout(() => setUploadError(null), 3000);
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    uploadProfilePicture.mutate(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      under_discipline: 'bg-red-100 text-red-800',
      regular_attender: 'bg-blue-100 text-blue-800',
      visitor: 'bg-yellow-100 text-yellow-800',
      withdrawn: 'bg-purple-100 text-purple-800',
      removed: 'bg-red-100 text-red-800',
      donor: 'bg-primary-100 text-primary-800'
    };

    return statusColors[status] || 'bg-gray-200 text-gray-700';
  };

  if (memberLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center mt-8">
        <h3 className="text-sm font-medium text-gray-900">Member not found</h3>
      </div>
    );
  }

  const membershipType = membershipTypes.find(t => t.value === member.membership_type)?.label || member.membership_type;
  const memberStatus = memberStatuses.find(s => s.value === member.status)?.label || member.status;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Member Profile Section */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/members')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Members
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {/* Profile Header */}
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center">
            <div className="relative">
              {member.profile_picture_url ? (
                <img
                  src={member.profile_picture_url}
                  alt={`${member.first_name} ${member.last_name}`}
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-medium text-3xl">
                    {member.first_name[0]}
                  </span>
                </div>
              )}
              <label
                htmlFor="profile-picture"
                className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50"
              >
                <Upload className="h-5 w-5 text-gray-600" />
                <input
                  type="file"
                  id="profile-picture"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploadProfilePicture.isPending}
                />
              </label>
            </div>
            <div className="ml-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {member.first_name} {member.middle_name ? `${member.middle_name} ` : ''}{member.last_name}
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    getStatusColor(member.status)
                  }`}
                >
                  {memberStatus}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                  {membershipType}
                </span>
              </div>
            </div>
          </div>

          {uploadError && (
            <div className="mt-4 rounded-md bg-red-50 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{uploadError}</h3>
                </div>
              </div>
            </div>
          )}

          {uploadSuccess && (
            <div className="mt-4 rounded-md bg-green-50 p-4">
              <div className="flex">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Profile picture updated successfully
                  </h3>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Member Details */}
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Membership Status
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {memberStatus}
              </dd>
            </div>

            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Membership Date
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {member.membership_date
                  ? format(new Date(member.membership_date), 'MMMM d, yyyy')
                  : 'Not specified'}
              </dd>
            </div>

            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Cake className="h-5 w-5 mr-2" />
                Birthday
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {member.birthday
                  ? format(new Date(member.birthday), 'MMMM d, yyyy')
                  : 'Not specified'}
              </dd>
            </div>

            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Phone className="h-5 w-5 mr-2" />
                Contact Number
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{member.contact_number}</dd>
            </div>

            {member.email && (
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Email Address
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{member.email}</dd>
              </div>
            )}

            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Address
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{member.address}</dd>
            </div>

            {member.envelope_number && (
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Envelope Number
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{member.envelope_number}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Financial History Section */}
      <div className="mt-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Financial History
            </h3>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 sm:flex sm:items-center sm:justify-between">
          <div className="relative max-w-xs">
            <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-sm placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="mt-4 sm:mt-0 sm:flex sm:space-x-4">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="block w-full rounded-md border border-gray-300 pl-10 pr-10 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div className="relative mt-4 sm:mt-0">
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="block w-full rounded-md border border-gray-300 pl-10 pr-10 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {transactionsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : paginatedTransactions && paginatedTransactions.length > 0 ? (
          <>
            <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(transaction.date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.type === 'income'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.category.split('_').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {transaction.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                        <span
                          className={
                            transaction.type === 'income'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }
                        >
                          {formatCurrency(transaction.amount, currency)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                itemsPerPage={itemsPerPage}
                totalItems={filteredTransactions?.length || 0}
                onItemsPerPageChange={handleItemsPerPageChange}
              />
            </div>
          </>
        ) : (
          <div className="text-center py-8 bg-white shadow sm:rounded-lg mt-4">
            <p className="text-sm text-gray-500">
              {searchTerm || typeFilter !== 'all' || categoryFilter !== 'all'
                ? 'No transactions found matching your search criteria'
                : 'No financial records found'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MemberProfile;