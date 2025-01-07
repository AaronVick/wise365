//  pages/admin/index.js

import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import ManageAgents from './manage';
import Training from './training';
import Chat from './chat';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('agents');

  const renderContent = () => {
    switch (activeTab) {
      case 'agents':
        return <ManageAgents />;
      case 'training':
        return <Training />;
      case 'chat':
        return <Chat />;
      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="flex space-x-4 mb-4">
        <button
          onClick={() => setActiveTab('agents')}
          className={`px-4 py-2 rounded ${
            activeTab === 'agents' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          Agents
        </button>
        <button
          onClick={() => setActiveTab('training')}
          className={`px-4 py-2 rounded ${
            activeTab === 'training' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          Training
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 rounded ${
            activeTab === 'chat' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          Chat
        </button>
      </div>
      <div className="bg-white shadow rounded p-6">{renderContent()}</div>
    </AdminLayout>
  );
}
