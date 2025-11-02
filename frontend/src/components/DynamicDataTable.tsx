// frontend/src/components/DynamicDataTable.tsx
'use client';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { dynamicAPI } from '@/lib/api';
import { Plus, Edit, Trash2, Search, Package } from 'lucide-react';

interface DynamicDataTableProps {
  modelName: string;
  modelDefinition: any;
}

interface RecordFormProps {
  modelDefinition: any;
  initialData?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

function RecordForm({ modelDefinition, initialData, onSave, onCancel }: RecordFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data: any) => {
    // Convert types based on field definitions
    const processedData = { ...data };
    modelDefinition.fields.forEach((field: any) => {
      if (field.type === 'number') {
        processedData[field.name] = parseFloat(data[field.name]) || 0;
      } else if (field.type === 'boolean') {
        processedData[field.name] = Boolean(data[field.name]);
      }
    });
    onSave(processedData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">
            {initialData ? 'Edit Record' : 'Create New Record'}
          </h3>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {modelDefinition.fields.map((field: any) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.name} {field.required && <span className="text-red-500">*</span>}
              </label>
              {field.type === 'boolean' ? (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    {...register(field.name, { 
                      required: field.required 
                    })}
                    defaultChecked={initialData?.[field.name]}
                    className="rounded"
                  />
                  <span className="ml-2 text-sm text-gray-600">Enabled</span>
                </div>
              ) : field.type === 'text' ? (
                <textarea
                  {...register(field.name, { 
                    required: field.required 
                  })}
                  defaultValue={initialData?.[field.name]}
                  rows={4}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <input
                  type={field.type === 'number' ? 'number' : 'text'}
                  {...register(field.name, { 
                    required: field.required 
                  })}
                  defaultValue={initialData?.[field.name]}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              )}
              {errors[field.name] && (
                <p className="text-red-500 text-sm mt-1">This field is required</p>
              )}
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              {initialData ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DynamicDataTable({ modelName, modelDefinition }: DynamicDataTableProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: records, isLoading, error } = useQuery({
    queryKey: ['dynamic', modelName],
    queryFn: () => dynamicAPI.getAll(modelName).then(res => res.data),
    retry: 1,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => dynamicAPI.create(modelName, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dynamic', modelName] });
      setIsCreateModalOpen(false);
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to create record');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      dynamicAPI.update(modelName, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dynamic', modelName] });
      setEditingRecord(null);
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to update record');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dynamicAPI.delete(modelName, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dynamic', modelName] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to delete record');
    },
  });

  const filteredRecords = records?.filter((record: any) =>
    Object.values(record).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error loading records: {(error as any).response?.data?.error || (error as any).message}</p>
          <button
            onClick={() => queryClient.refetchQueries({ queryKey: ['dynamic', modelName] })}
            className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{modelDefinition.name} Records</h2>
          <p className="text-gray-600">Manage {modelDefinition.tableName} data</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          disabled={createMutation.isPending}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={20} />
          {createMutation.isPending ? 'Creating...' : 'Add New'}
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {modelDefinition.fields.map((field: any) => (
                  <th
                    key={field.name}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {field.name}
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords?.map((record: any) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  {modelDefinition.fields.map((field: any) => (
                    <td key={field.name} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {field.type === 'boolean' ? (
                        record[field.name] ? 'Yes' : 'No'
                      ) : (
                        String(record[field.name] || '')
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingRecord(record)}
                        disabled={updateMutation.isPending}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-900 disabled:opacity-50"
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this record?')) {
                            deleteMutation.mutate(record.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="flex items-center gap-1 text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                        {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRecords?.length === 0 && (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No records found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first record'}
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
            >
              Create Record
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {(isCreateModalOpen || editingRecord) && (
        <RecordForm
          modelDefinition={modelDefinition}
          initialData={editingRecord}
          onSave={(data) => {
            if (editingRecord) {
              updateMutation.mutate({ id: editingRecord.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          onCancel={() => {
            setIsCreateModalOpen(false);
            setEditingRecord(null);
          }}
        />
      )}
    </div>
  );
}