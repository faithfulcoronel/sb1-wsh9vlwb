import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { usePermissions } from '../../hooks/usePermissions';
import PermissionGate from '../../components/PermissionGate';
import {
  Database,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

type Database = {
  id: string;
  name: string;
  description: string | null;
  connection_type: 'postgresql' | 'mysql' | 'sqlserver' | 'oracle';
  connection_string: string;
  status: 'active' | 'inactive' | 'error';
  last_checked_at: string | null;
  created_at: string;
};

function DatabaseManagement() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    connection_type: 'postgresql' as Database['connection_type'],
    connection_string: '',
  });

  const { data: databases, isLoading } = useQuery({
    queryKey: ['databases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('databases')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Database[];
    },
    enabled: hasPermission('database.view'),
  });

  const createDatabaseMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('databases')
        .insert([{
          ...data,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['databases'] });
      setSuccess('Database created successfully');
      setShowForm(false);
      setFormData({
        name: '',
        description: '',
        connection_type: 'postgresql',
        connection_string: '',
      });
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (error: Error) => {
      setError(error.message);
      setTimeout(() => setError(null), 5000);
    },
  });

  const deleteDatabaseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('databases')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['databases'] });
      setSuccess('Database deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (error: Error) => {
      setError(error.message);
      setTimeout(() => setError(null), 5000);
    },
  });

  const checkConnectionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .rpc('check_database_connection', { database_id: id });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['databases'] });
    },
    onError: (error: Error) => {
      setError(error.message);
      setTimeout(() => setError(null), 5000);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.connection_string) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      await createDatabaseMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Error creating database:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!databases || databases.length <= 1) {
      setError('Cannot delete the last database');
      return;
    }

    if (window.confirm('Are you sure you want to delete this database?')) {
      try {
        await deleteDatabaseMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting database:', error);
      }
    }
  };

  const handleCheckConnection = async (id: string) => {
    try {
      await checkConnectionMutation.mutateAsync(id);
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const getStatusColor = (status: Database['status']) => {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'inactive':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Database Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your database connections and configurations.
          </p>
        </div>
        <PermissionGate permission="database.create">
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Database
            </button>
          </div>
        </PermissionGate>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-md bg-green-50 p-4">
          <div className="flex">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">{success}</h3>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="mt-8 bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Add New Database</h3>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Database Name *
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="connection_type" className="block text-sm font-medium text-gray-700">
                  Connection Type *
                </label>
                <select
                  name="connection_type"
                  id="connection_type"
                  required
                  value={formData.connection_type}
                  onChange={(e) => setFormData({ ...formData, connection_type: e.target.value as Database['connection_type'] })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="postgresql">PostgreSQL</option>
                  <option value="mysql">MySQL</option>
                  <option value="sqlserver">SQL Server</option>
                  <option value="oracle">Oracle</option>
                </select>
              </div>

              <div>
                <label htmlFor="connection_string" className="block text-sm font-medium text-gray-700">
                  Connection String *
                </label>
                <input
                  type="text"
                  name="connection_string"
                  id="connection_string"
                  required
                  value={formData.connection_string}
                  onChange={(e) => setFormData({ ...formData, connection_string: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder={`${formData.connection_type}://user:password@host:port/database`}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createDatabaseMutation.isPending}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {createDatabaseMutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                      Adding...
                    </>
                  ) : (
                    'Add Database'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : databases && databases.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {databases.map((database) => (
            <div
              key={database.id}
              className="bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Database className={`h-6 w-6 ${getStatusColor(database.status)}`} />
                    <h3 className="ml-2 text-lg font-medium text-gray-900">
                      {database.name}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleCheckConnection(database.id)}
                      disabled={checkConnectionMutation.isPending}
                      className="text-gray-600 hover:text-primary-600 disabled:opacity-50"
                      title="Check connection"
                    >
                      <RefreshCw className={`h-5 w-5 ${checkConnectionMutation.isPending ? 'animate-spin' : ''}`} />
                    </button>
                    <PermissionGate permission="database.delete">
                      <button
                        onClick={() => handleDelete(database.id)}
                        disabled={deleteDatabaseMutation.isPending || databases.length <= 1}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={databases.length <= 1 ? "Cannot delete the last database" : "Delete database"}
                      >
                        {deleteDatabaseMutation.isPending ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                      </button>
                    </PermissionGate>
                  </div>
                </div>
                {database.description && (
                  <p className="mt-2 text-sm text-gray-500">{database.description}</p>
                )}
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-500">
                    Type: <span className="font-medium">{database.connection_type.toUpperCase()}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Status: <span className={`font-medium ${getStatusColor(database.status)}`}>
                      {database.status.toUpperCase()}
                    </span>
                  </p>
                  {database.last_checked_at && (
                    <p className="text-sm text-gray-500">
                      Last Checked: {new Date(database.last_checked_at).toLocaleString()}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">
                    Connection String:
                    <span className="ml-2 font-mono text-xs break-all">
                      {database.connection_string}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-white shadow sm:rounded-lg mt-8">
          <Database className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No databases</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding a new database connection.
          </p>
          <PermissionGate permission="database.create">
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Database
              </button>
            </div>
          </PermissionGate>
        </div>
      )}
    </div>
  );
}

export default DatabaseManagement;