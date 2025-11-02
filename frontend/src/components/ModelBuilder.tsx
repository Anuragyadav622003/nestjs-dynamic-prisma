// frontend/src/components/ModelBuilder.tsx
'use client';
import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { modelsAPI } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Plus } from 'lucide-react';

interface ModelField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'text';
  required: boolean;
  default?: any;
  unique?: boolean;
}

interface ModelFormData {
  name: string;
  tableName: string;
  fields: ModelField[];
  ownerField?: string;
  rbac: {
    Admin: string[];
    Manager: string[];
    Viewer: string[];
  };
}

const fieldTypes = [
  { value: 'string', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date', label: 'Date' },
  { value: 'text', label: 'Long Text' },
];

const permissions = ['create', 'read', 'update', 'delete', 'all'];

export default function ModelBuilder() {
  const queryClient = useQueryClient();
  
  const { register, control, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm<ModelFormData>({
    defaultValues: {
      fields: [{ name: '', type: 'string', required: false }],
      rbac: {
        Admin: ['all'],
        Manager: ['create', 'read', 'update'],
        Viewer: ['read'],
      },
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'fields',
  });

  const createModelMutation = useMutation({
    mutationFn: (data: ModelFormData) => modelsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['model-definitions'] });
      alert('Model created successfully!');
      // Reset form
      window.location.reload();
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Error creating model');
    },
  });

  const onSubmit = async (data: ModelFormData) => {
    createModelMutation.mutate(data);
  };

  const addField = () => {
    append({ name: '', type: 'string', required: false });
  };

  // Handle RBAC permission changes
  const handlePermissionChange = (role: keyof ModelFormData['rbac'], permission: string, checked: boolean) => {
    const currentPermissions = getValues(`rbac.${role}`) || [];
    let newPermissions: string[];

    if (checked) {
      newPermissions = [...currentPermissions, permission];
    } else {
      newPermissions = currentPermissions.filter(p => p !== permission);
    }

    setValue(`rbac.${role}`, newPermissions);
  };

  // Check if a permission is selected for a role
  const isPermissionSelected = (role: keyof ModelFormData['rbac'], permission: string): boolean => {
    const rolePermissions = getValues(`rbac.${role}`) || [];
    return rolePermissions.includes(permission);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b">
          <h1 className="text-2xl font-bold text-gray-900">Create New Model</h1>
          <p className="text-gray-600 mt-1">Define your data model with fields and permissions</p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
          {/* Basic Model Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model Name *
              </label>
              <input
                {...register('name', { required: 'Model name is required' })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Product, Employee, Customer"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Table Name
              </label>
              <input
                {...register('tableName')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., products (auto-generated if empty)"
              />
              <p className="text-gray-500 text-sm mt-1">
                Database table name. Leave empty for auto-generation.
              </p>
            </div>
          </div>

          {/* Fields Section */}
          <div className="border rounded-lg">
            <div className="px-6 py-4 border-b bg-gray-50">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Fields</h2>
                <button
                  type="button"
                  onClick={addField}
                  className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                  <Plus size={16} />
                  Add Field
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-4 items-start p-4 border rounded-lg bg-white">
                  <div className="col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Field Name
                    </label>
                    <input
                      {...register(`fields.${index}.name` as const, { 
                        required: 'Field name is required' 
                      })}
                      placeholder="e.g., title, price, isActive"
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.fields?.[index]?.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.fields[index]?.name?.message}</p>
                    )}
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      {...register(`fields.${index}.type` as const)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    >
                      {fieldTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Constraints
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          {...register(`fields.${index}.required` as const)}
                          className="mr-2 rounded"
                        />
                        <span className="text-sm">Required</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          {...register(`fields.${index}.unique` as const)}
                          className="mr-2 rounded"
                        />
                        <span className="text-sm">Unique</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Value
                    </label>
                    <input
                      {...register(`fields.${index}.default` as const)}
                      placeholder="Optional default value"
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="col-span-2 flex items-end">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="flex items-center gap-1 bg-red-500 text-white p-2 rounded hover:bg-red-600"
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RBAC Permissions */}
          <div className="border rounded-lg">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Role Permissions</h2>
              <p className="text-gray-600 text-sm mt-1">
                Configure what each role can do with this model
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(['Admin', 'Manager', 'Viewer'] as const).map((role) => (
                  <div key={role} className="border rounded-lg p-4 bg-white">
                    <h3 className="font-medium text-gray-900 mb-3">{role}</h3>
                    <div className="space-y-2">
                      {permissions.map((permission) => (
                        <label key={permission} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={isPermissionSelected(role, permission)}
                            onChange={(e) => handlePermissionChange(role, permission, e.target.checked)}
                            className="mr-3 rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 capitalize">{permission}</span>
                        </label>
                      ))}
                    </div>
                    {/* Hidden input to store the value for form submission */}
                    <input
                      type="hidden"
                      {...register(`rbac.${role}` as const)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Owner Field */}
          <div className="border rounded-lg p-6 bg-white">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Owner Field (optional)
            </label>
            <input
              {...register('ownerField')}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., ownerId, createdBy, userId"
            />
            <p className="text-gray-500 text-sm mt-2">
              Field name that will store the user ID for ownership-based permissions. 
              Leave empty if you don't need ownership tracking.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-6 border-t">
            <button
              type="submit"
              disabled={createModelMutation.isPending}
              className="flex items-center gap-2 bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createModelMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Publishing...
                </>
              ) : (
                'Publish Model'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}