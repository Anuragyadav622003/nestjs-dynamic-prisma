// frontend/src/app/dashboard/page.tsx
'use client';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { modelsAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import ModelBuilder from '@/components/ModelBuilder';
import DynamicDataTable from '@/components/DynamicDataTable';
import { LogOut, Package, Plus, Settings } from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'models' | 'builder' | string>('models');
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const { user, logout } = useAuth();

  const { data: models, isLoading } = useQuery({
    queryKey: ['model-definitions'],
    queryFn: () => modelsAPI.getAll().then(res => res.data),
  });

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg">
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold text-gray-800">CRUD Platform</h1>
            <p className="text-sm text-gray-600 mt-1">Welcome, {user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-1 text-xs rounded-full ${
                user?.role === 'Admin' 
                  ? 'bg-purple-100 text-purple-800'
                  : user?.role === 'Manager'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {user?.role}
              </span>
            </div>
          </div>
          
          <nav className="p-4 space-y-2">
            <button
              onClick={() => setActiveTab('models')}
              className={`w-full flex items-center gap-3 text-left p-3 rounded-lg transition-colors ${
                activeTab === 'models' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Package size={20} />
              <span>All Models</span>
            </button>
            
            {user?.role === 'Admin' && (
              <button
                onClick={() => setActiveTab('builder')}
                className={`w-full flex items-center gap-3 text-left p-3 rounded-lg transition-colors ${
                  activeTab === 'builder' 
                    ? 'bg-green-500 text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Plus size={20} />
                <span>Model Builder</span>
              </button>
            )}

            {/* Model List */}
            <div className="pt-6">
              <div className="px-3 mb-2">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Your Models
                </h2>
              </div>
              <div className="space-y-1">
                {models?.map((model: any) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      setActiveTab(model.name);
                      setSelectedModel(model);
                    }}
                    className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${
                      activeTab === model.name 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Package size={16} />
                      <span>{model.name}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{model.tableName}</p>
                  </button>
                ))}
              </div>
            </div>
          </nav>

          {/* Logout Button */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 text-left p-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'models' && (
            <div className="p-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">All Models</h2>
                <p className="text-gray-600">
                  Manage your data models and their records
                </p>
              </div>
              
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="border rounded-lg p-6 bg-white animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {models?.map((model: any) => (
                    <div key={model.id} className="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">{model.name}</h3>
                          <p className="text-gray-600 text-sm">{model.tableName}</p>
                        </div>
                        <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {model.fields?.length || 0} fields
                        </div>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex gap-1 flex-wrap">
                          {Object.entries(model.rbac || {}).map(([role, perms]: [string, any]) => (
                            <span key={role} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {role}: {perms.length} perms
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab(model.name);
                          setSelectedModel(model);
                        }}
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                      >
                        Manage Data
                      </button>
                    </div>
                  ))}
                  
                  {models?.length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <Package size={48} className="mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No models yet</h3>
                      <p className="text-gray-600 mb-4">Create your first model to get started</p>
                      {user?.role === 'Admin' && (
                        <button
                          onClick={() => setActiveTab('builder')}
                          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
                        >
                          Create Model
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'builder' && <ModelBuilder />}

          {selectedModel && activeTab === selectedModel.name && (
            <DynamicDataTable
              modelName={selectedModel.tableName}
              modelDefinition={selectedModel}
            />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}