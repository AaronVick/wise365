// pages/admin/index.js

import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import ManageAgents from './manage';
import Training from './training';
import Chat from './chat';
import Prompts from './prompts';
import AgentStats from './agentStats';
import UsageStats from './usageStats';
import TenantManagement from './tenantManagement';
import AdminManagement from './adminManagement';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('globalAgents');

  const renderContent = () => {
    switch (activeTab) {
      case 'globalAgents':
        return (
          <>
            <ManageAgents />
            <Training />
            <Chat />
            <Prompts />
          </>
        );
      case 'agentStats':
        return <AgentStats />;
      case 'usageStats':
        return <UsageStats />;
      case 'tenantManagement':
        return <TenantManagement />;
      case 'adminManagement':
        return <AdminManagement />;
      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      {/* Main Tab Navigation */}
      <div className="flex space-x-4 mb-4">
        {/* Agent Management Tabs */}
        <button
          onClick={() => setActiveTab('globalAgents')}
          className={`px-4 py-2 rounded ${
            activeTab === 'globalAgents' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          Global Agents
        </button>
        <button
          onClick={() => setActiveTab('agentStats')}
          className={`px-4 py-2 rounded ${
            activeTab === 'agentStats' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          Agent Stats
        </button>

        {/* System Management Tabs */}
        <button
          onClick={() => setActiveTab('usageStats')}
          className={`px-4 py-2 rounded ${
            activeTab === 'usageStats' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          Usage Stats
        </button>
        <button
          onClick={() => setActiveTab('tenantManagement')}
          className={`px-4 py-2 rounded ${
            activeTab === 'tenantManagement' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          Tenant Management
        </button>
        <button
          onClick={() => setActiveTab('adminManagement')}
          className={`px-4 py-2 rounded ${
            activeTab === 'adminManagement' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          Admin Management
        </button>
      </div>

      {/* Render Active Tab Content */}
      <div className="bg-white shadow rounded p-6">{renderContent()}</div>
    </AdminLayout>
  );
}
