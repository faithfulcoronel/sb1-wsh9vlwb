import React, { useState } from 'react';
import { Link, Routes, Route, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import MemberProfile from './MemberProfile';
import MemberEdit from './MemberEdit';
import MemberAdd from './MemberAdd';
import { useMessageStore } from '../../components/MessageHandler';
import { useEnumValues } from '../../hooks/useEnumValues';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/Pagination';
import {
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Search,
  Filter,
} from 'lucide-react';

type Member = {
  id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  contact_number: string;
  address: string;
  membership_type: string;
  status: string;
  membership_date: string | null;
  profile_picture_url: string | null;
  deleted_at: string | null;
};

function MemberList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { addMessage } = useMessageStore();
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const { memberStatuses, isLoading: enumsLoading } = useEnumValues();

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .is('deleted_at', null)
        .order('last_name', { ascending: true });

      if (error) throw error;
      return data as Member[];
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .rpc('soft_delete_member', { member_id: id });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      addMessage({
        type: 'success',
        text: 'Member deleted successfully',
        duration: 3000,
      });
      setMemberToDelete(null);
    },
    onError: (error: Error) => {
      addMessage({
        type: 'error',
        text: 'Failed to delete member',
        duration: 5000,
      });
      console.error('Error deleting member:', error);
      setMemberToDelete(null);
    },
  });

  const handleDelete = async (member: Member) => {
    setMemberToDelete(member);
    addMessage({
      type: 'warning',
      text: `Are you sure you want to delete ${member.first_name} ${member.last_name}?`,
      duration: 0, // Don't auto-dismiss
    });
  };

  const confirmDelete = async () => {
    if (memberToDelete) {
      try {
        await deleteMemberMutation.mutateAsync(memberToDelete.id);
      } catch (error) {
        console.error('Error deleting member:', error);
      }
    }
  };

  const handleEdit = (member: Member) => {
    navigate(`/members/${member.id}/edit`);
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

    // Return the status color if found, otherwise return a default color
    return statusColors[status] || 'bg-gray-200 text-gray-700';
  };

  const filteredMembers = members?.filter((member) => {
    const matchesSearch = 
      member.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.contact_number.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    
    return matchesSearch && matchesStatus;
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
    totalItems: filteredMembers?.length || 0,
  });

  const paginatedMembers = filteredMembers?.slice(startIndex, endIndex);

  const isLoading = membersLoading || enumsLoading;

  return (
    <div>
      <div className="mb-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Members</h1>
            <p className="mt-2 text-sm text-gray-700">
              A list of all church members including their name, contact information, and membership status.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Link
              to="/members/add"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Link>
          </div>
        </div>

        <div className="mt-6 sm:flex sm:items-center sm:justify-between">
          <div className="relative max-w-xs">
            <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-sm placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="mt-4 sm:mt-0">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="block w-full rounded-md border border-gray-300 pl-10 pr-10 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                {memberStatuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : paginatedMembers && paginatedMembers.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedMembers.map((member) => (
              <Link
                key={member.id}
                to={`/members/${member.id}`}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {member.profile_picture_url ? (
                        <img
                          src={member.profile_picture_url}
                          alt={`${member.first_name} ${member.last_name}`}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-600 font-medium text-lg">
                            {member.first_name[0]}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        className="p-1 text-gray-400 hover:text-primary-500"
                        onClick={(e) => {
                          e.preventDefault();
                          handleEdit(member);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        className="p-1 text-gray-400 hover:text-red-500"
                        onClick={(e) => {
                          e.preventDefault();
                          handleDelete(member);
                        }}
                        disabled={deleteMemberMutation.isPending}
                      >
                        {deleteMemberMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {member.first_name} {member.middle_name ? `${member.middle_name} ` : ''}{member.last_name}
                    </h3>
                    <p className="text-sm text-gray-500">{member.contact_number}</p>
                    <p className="text-sm text-gray-500 mt-1">{member.address}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getStatusColor(member.status)
                      }`}
                    >
                      {memberStatuses.find(s => s.value === member.status)?.label || member.status}
                    </span>
                  </div>
                  <div className="mt-4 text-sm text-gray-500">
                    {member.membership_date 
                      ? `Member since ${new Date(member.membership_date).toLocaleDateString()}`
                      : 'No membership date'}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              itemsPerPage={itemsPerPage}
              totalItems={filteredMembers?.length || 0}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </div>
        </>
      ) : (
        <div className="text-center py-8 bg-white shadow sm:rounded-lg">
          <p className="text-sm text-gray-500">
            {searchTerm || statusFilter !== 'all'
              ? 'No members found matching your search criteria'
              : 'No members found. Add your first member by clicking the "Add Member" button above.'}
          </p>
        </div>
      )}

      {/* Confirmation Dialog */}
      {memberToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Delete Member
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete {memberToDelete.first_name} {memberToDelete.last_name}? 
              This action cannot be undone and will also delete all associated records.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteMemberMutation.isPending}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {deleteMemberMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
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