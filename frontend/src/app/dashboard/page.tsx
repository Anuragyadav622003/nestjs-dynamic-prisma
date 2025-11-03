// frontend/src/app/dashboard/page.tsx
'use client';
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { modelsAPI, type ModelsResponse, type ModelDefinition } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import ModelBuilder from '@/components/ModelBuilder';
import DynamicDataTable from '@/components/DynamicDataTable';
import { 
  LogOut, 
  Package, 
  Plus, 
  Database, 
  Layers, 
  Users,
  Shield,
  ChevronRight,
  Search,
  Filter,
  Download,
  Settings,
  Bell,
  User,
  Home,
  BarChart3,
  Menu,
  Sparkles,
  X,
  Eye
} from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'builder' | string>('overview');
  const [selectedModel, setSelectedModel] = useState<ModelDefinition | null>(null);
  const [selectedModelGroup, setSelectedModelGroup] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const { data: modelsData, isLoading, error } = useQuery({
    queryKey: ['model-definitions'],
    queryFn: () => modelsAPI.getAll().then(res => res.data as ModelsResponse),
    retry: 3,
    staleTime: 5 * 60 * 1000,
  });

  // Filter model groups based on search
  const filteredModelGroups = useMemo(() => {
    if (!modelsData?.groupedByModelName) return {};
    
    return Object.entries(modelsData.groupedByModelName).reduce((acc, [modelName, instances]) => {
      if (modelName.toLowerCase().includes(searchTerm.toLowerCase()) || 
          instances.some(instance => instance.tableName.toLowerCase().includes(searchTerm.toLowerCase()))) {
        acc[modelName] = instances;
      }
      return acc;
    }, {} as Record<string, any[]>);
  }, [modelsData?.groupedByModelName, searchTerm]);

  // Handle model selection
  const handleModelSelect = (modelName: string, modelInstance?: ModelDefinition) => {
    if (modelInstance) {
      setActiveTab(`model-${modelInstance.id}`);
      setSelectedModel(modelInstance);
      setSelectedModelGroup(modelName);
    } else {
      setActiveTab(`group-${modelName}`);
      setSelectedModel(null);
      setSelectedModelGroup(modelName);
    }
    setMobileMenuOpen(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'from-purple-500 to-pink-500';
      case 'Manager': return 'from-blue-500 to-cyan-500';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Admin': return <Shield className="w-4 h-4" />;
      case 'Manager': return <Users className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  // Navigation items
  const navItems = [
    { 
      name: 'Overview', 
      icon: <Layers className="w-5 h-5" />, 
      tab: 'overview',
      active: activeTab === 'overview'
    },
    ...(user?.role === 'Admin' ? [{
      name: 'Model Builder', 
      icon: <Plus className="w-5 h-5" />, 
      tab: 'builder',
      active: activeTab === 'builder'
    }] : [])
  ];

  // Stats cards data
  const stats = [
    {
      title: 'Total Models',
      value: modelsData?.total || 0,
      icon: <Package className="w-6 h-6" />,
      gradient: 'from-blue-500 to-cyan-500',
      description: 'Active data models'
    },
    {
      title: 'Model Types',
      value: modelsData?.uniqueModelNames || 0,
      icon: <Layers className="w-6 h-6" />,
      gradient: 'from-emerald-500 to-green-500',
      description: 'Unique schemas'
    },
    {
      title: 'Active Tables',
      value: modelsData?.total || 0,
      icon: <Database className="w-6 h-6" />,
      gradient: 'from-purple-500 to-pink-500',
      description: 'Database tables'
    },
    {
      title: 'Your Role',
      value: user?.role || 'User',
      icon: getRoleIcon(user?.role || 'User'),
      gradient: getRoleColor(user?.role || 'User'),
      description: 'Access level'
    }
  ];

  // Mobile sidebar component
  const MobileSidebar = () => (
    <div className={`fixed inset-0 z-50 lg:hidden transition-transform duration-300 ${
      mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
      <div className="relative w-80 h-full bg-slate-900 border-r border-slate-800 overflow-y-auto">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">DataForge</h1>
                <p className="text-xs text-slate-400">AI-Powered CRM</p>
              </div>
            </div>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* User Info */}
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-1 text-xs rounded-full bg-gradient-to-r ${getRoleColor(user?.role || '')} text-white`}>
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                setActiveTab(item.tab);
                setSelectedModel(null);
                setSelectedModelGroup(null);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                item.active
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </button>
          ))}
        </nav>

        {/* Model Groups */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
              Model Groups
            </h3>
            <span className="bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded-lg">
              {modelsData?.uniqueModelNames || 0}
            </span>
          </div>
          
          <div className="space-y-2">
            {Object.entries(filteredModelGroups).map(([modelName, instances]) => (
              <button
                key={modelName}
                onClick={() => handleModelSelect(modelName)}
                className="w-full text-left p-3 rounded-xl bg-slate-800/30 border border-slate-700 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="w-4 h-4 text-blue-400" />
                    <div>
                      <p className="text-sm font-medium text-white">{modelName}</p>
                      <p className="text-xs text-slate-400">{instances.length} tables</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-950 text-white">
        <MobileSidebar />
        
        {/* Mobile Header */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-slate-400 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Database className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">DataForge</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="p-2 text-slate-400 hover:text-white">
                <Bell className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <div className="flex pt-16 lg:pt-0">
          {/* Desktop Sidebar */}
          <div className="hidden lg:flex w-80 flex-col border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl">
            {/* Header */}
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">DataForge</h1>
                  <p className="text-sm text-slate-400">AI-Powered CRM</p>
                </div>
              </div>
              
              {/* User Info */}
              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-white font-semibold">
                    {user?.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user?.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full bg-gradient-to-r ${getRoleColor(user?.role || '')} text-white`}>
                        {user?.role}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Navigation */}
            <nav className="p-4 space-y-2 flex-1">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    setActiveTab(item.tab);
                    setSelectedModel(null);
                    setSelectedModelGroup(null);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                    item.active
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium">{item.name}</span>
                </button>
              ))}

              {/* Search */}
              <div className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search models..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all"
                  />
                </div>
              </div>

              {/* Model Groups */}
              <div className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
                    Model Groups
                  </h3>
                  <span className="bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded-lg">
                    {modelsData?.uniqueModelNames || 0}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {Object.entries(filteredModelGroups).map(([modelName, instances]) => (
                    <div key={modelName} className="space-y-1">
                      <button
                        onClick={() => handleModelSelect(modelName)}
                        className={`w-full text-left p-3 rounded-xl transition-all ${
                          activeTab === `group-${modelName}`
                            ? 'bg-slate-800 border border-slate-700'
                            : 'bg-slate-800/30 border border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Package className="w-4 h-4 text-blue-400" />
                            <div>
                              <p className="text-sm font-medium text-white">{modelName}</p>
                              <p className="text-xs text-slate-400">{instances.length} tables</p>
                            </div>
                          </div>
                          <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${
                            activeTab === `group-${modelName}` ? 'rotate-90' : ''
                          }`} />
                        </div>
                      </button>

                      {/* Model Instances */}
                      {activeTab === `group-${modelName}` && instances.map((instance: any) => (
                        <button
                          key={instance.id}
                          onClick={() => handleModelSelect(modelName, instance)}
                          className={`w-full text-left p-2 pl-12 rounded-lg transition-all ${
                            activeTab === `model-${instance.id}`
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Database className="w-3 h-3" />
                              <span className="text-sm truncate">{instance.tableName}</span>
                            </div>
                            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded">
                              {instance.fields?.length || 0}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800">
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 p-3 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-h-screen">
            {/* Desktop Header */}
            <header className="hidden lg:flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {activeTab === 'overview' && 'Dashboard Overview'}
                  {activeTab === 'builder' && 'Model Builder'}
                  {selectedModelGroup && activeTab.startsWith('group-') && `${selectedModelGroup} Instances`}
                  {selectedModel && activeTab.startsWith('model-') && `${selectedModel.name} Data`}
                </h1>
                <p className="text-slate-400 mt-1">
                  {activeTab === 'overview' && 'Manage your data models and instances'}
                  {activeTab === 'builder' && 'Create and configure new data models'}
                  {selectedModelGroup && activeTab.startsWith('group-') && `Manage all tables for ${selectedModelGroup}`}
                  {selectedModel && activeTab.startsWith('model-') && `View and manage ${selectedModel.tableName} records`}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
                  <Bell className="w-5 h-5" />
                </button>
                <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </header>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, index) => (
                      <div
                        key={stat.title}
                        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 hover:border-slate-600 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-slate-400 text-sm font-medium mb-2">{stat.title}</p>
                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                            <p className="text-slate-500 text-xs mt-1">{stat.description}</p>
                          </div>
                          <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.gradient} text-white shadow-lg`}>
                            {stat.icon}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Model Groups Grid */}
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-white">Model Groups</h2>
                      <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700 transition-all">
                          <Filter className="w-4 h-4" />
                          Filter
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700 transition-all">
                          <Download className="w-4 h-4" />
                          Export
                        </button>
                      </div>
                    </div>

                    {isLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 animate-pulse">
                            <div className="h-4 bg-slate-700 rounded w-3/4 mb-4"></div>
                            <div className="h-3 bg-slate-700 rounded w-1/2 mb-6"></div>
                            <div className="space-y-2">
                              <div className="h-2 bg-slate-700 rounded"></div>
                              <div className="h-2 bg-slate-700 rounded w-5/6"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : error ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Eye className="w-8 h-8 text-red-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Failed to load models</h3>
                        <p className="text-slate-400 mb-4">Please check your connection and try again</p>
                        <button 
                          onClick={() => window.location.reload()}
                          className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                        >
                          Retry
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.entries(modelsData?.groupedByModelName || {}).map(([modelName, instances]) => (
                          <div 
                            key={modelName}
                            onClick={() => handleModelSelect(modelName)}
                            className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 hover:border-blue-500/50 cursor-pointer transition-all duration-300 group"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                                  {modelName}
                                </h3>
                                <p className="text-slate-400 text-sm mt-1">{instances.length} table{instances.length !== 1 ? 's' : ''}</p>
                              </div>
                              <span className="bg-blue-500/10 text-blue-400 text-xs px-3 py-1 rounded-full">
                                {instances.reduce((total, instance) => total + (instance.fields?.length || 0), 0)} fields
                              </span>
                            </div>
                            
                            <div className="space-y-3 mb-4">
                              <div className="text-sm text-slate-300">Tables</div>
                              <div className="space-y-2">
                                {instances.slice(0, 3).map((instance: any) => (
                                  <div key={instance.id} className="flex items-center justify-between text-sm p-2 bg-slate-700/30 rounded-lg">
                                    <span className="text-slate-200 font-medium">{instance.tableName}</span>
                                    <span className="text-slate-400 text-xs bg-slate-800 px-2 py-1 rounded">
                                      {instance.fields?.length || 0}f
                                    </span>
                                  </div>
                                ))}
                                {instances.length > 3 && (
                                  <div className="text-center text-slate-500 text-sm">
                                    +{instances.length - 3} more tables
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                              <div className="flex gap-1">
                                {Object.entries(instances[0]?.rbac || {}).slice(0, 2).map(([role]) => (
                                  <span key={role} className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-full">
                                    {role}
                                  </span>
                                ))}
                              </div>
                              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                                Manage
                              </button>
                            </div>
                          </div>
                        ))}
                        
                        {(!modelsData?.models || modelsData.models.length === 0) && (
                          <div className="col-span-full text-center py-16">
                            <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                              <Package className="w-10 h-10 text-slate-600" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">No models yet</h3>
                            <p className="text-slate-400 mb-6 max-w-md mx-auto">
                              Create your first model to start building your AI-powered CRM platform
                            </p>
                            {user?.role === 'Admin' && (
                              <button
                                onClick={() => setActiveTab('builder')}
                                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2 mx-auto"
                              >
                                <Sparkles className="w-5 h-5" />
                                Create Your First Model
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Model Builder Tab */}
              {activeTab === 'builder' && <ModelBuilder />}

              {/* Model Group View */}
              {selectedModelGroup && activeTab === `group-${selectedModelGroup}` && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <button
                        onClick={() => setActiveTab('overview')}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
                      >
                        <ChevronRight className="w-4 h-4 rotate-180" />
                        Back to Overview
                      </button>
                      <h2 className="text-2xl font-bold text-white">{selectedModelGroup} Instances</h2>
                      <p className="text-slate-400">
                        Manage all table instances for the {selectedModelGroup} model type
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredModelGroups[selectedModelGroup]?.map((instance: any) => (
                      <div key={instance.id} className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 hover:border-blue-500/50 transition-all duration-300">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-bold text-white text-lg">{instance.tableName}</h3>
                            <p className="text-slate-400 text-sm mt-1">
                              Created {new Date(instance.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="bg-emerald-500/10 text-emerald-400 text-xs px-3 py-1 rounded-full">
                            {instance.fields?.length || 0} fields
                          </span>
                        </div>
                        
                        <div className="space-y-3 mb-6">
                          <div className="text-sm text-slate-300">Fields Preview</div>
                          <div className="flex flex-wrap gap-2">
                            {instance.fields?.slice(0, 5).map((field: any) => (
                              <span key={field.name} className="text-xs bg-slate-700 text-slate-300 px-3 py-1.5 rounded-full">
                                {field.name}
                              </span>
                            ))}
                            {instance.fields?.length > 5 && (
                              <span className="text-xs bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-full">
                                +{instance.fields.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleModelSelect(selectedModelGroup, instance)}
                          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium transition-colors"
                        >
                          Manage Data
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Individual Model Data Table */}
              {selectedModel && activeTab === `model-${selectedModel.id}` && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <button
                        onClick={() => handleModelSelect(selectedModelGroup!)}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
                      >
                        <ChevronRight className="w-4 h-4 rotate-180" />
                        Back to {selectedModelGroup}
                      </button>
                      <h2 className="text-2xl font-bold text-white">{selectedModel.name} Data</h2>
                      <p className="text-slate-400">
                        Managing records in <code className="bg-slate-800 px-2 py-1 rounded text-sm">{selectedModel.tableName}</code>
                      </p>
                    </div>
                  </div>

                  <DynamicDataTable
                    modelName={selectedModel.tableName}
                    modelDefinition={selectedModel}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}