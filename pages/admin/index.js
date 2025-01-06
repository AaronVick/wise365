import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import AgentCard from '@/components/AgentCard';

export default function AdminDashboard() {
  const [data, setData] = useState([]);
  const [agents, setAgents] = useState([]);
  const [activeTab, setActiveTab] = useState('agents');
  const [editingAgent, setEditingAgent] = useState(null);
  const [newAgent, setNewAgent] = useState({
    agentId: '',
    agentName: '',
    Role: '',
    RoleInfo: '',
    Type: '',
    language: 'English',
    personality: '',
    tasks: [],
  });
  const [newKnowledge, setNewKnowledge] = useState({
    agentId: '',
    dataType: 'knowledge_base',
    description: '',
    data: '',
  });
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);

  // Fetch data when activeTab changes
  useEffect(() => {
    async function fetchData() {
      const res = await fetch(`/api/admin?tab=${activeTab}`);
      const result = await res.json();
      setData(result || []);
      if (activeTab === 'training' || activeTab === 'chat') {
        // Fetch agents for dropdowns
        const agentsRes = await fetch('/api/admin/agents');
        const agentsData = await agentsRes.json();
        setAgents(agentsData || []);
      }
    }
    fetchData();
  }, [activeTab]);

  const handleAddAgent = async () => {
    const res = await fetch('/api/admin/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAgent),
    });

    if (res.ok) {
      alert('Agent added successfully!');
      setNewAgent({
        agentId: '',
        agentName: '',
        Role: '',
        RoleInfo: '',
        Type: '',
        language: 'English',
        personality: '',
        tasks: [],
      });
      const updatedData = await fetch(`/api/admin?tab=agents`).then((res) => res.json());
      setData(updatedData);
    } else {
      alert('Failed to add agent.');
    }
  };

  const handleEditAgent = async () => {
    const res = await fetch(`/api/admin/agents/${editingAgent.agentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingAgent),
    });

    if (res.ok) {
      alert('Agent updated successfully!');
      setEditingAgent(null);
      const updatedData = await fetch(`/api/admin?tab=agents`).then((res) => res.json());
      setData(updatedData);
    } else {
      alert('Failed to update agent.');
    }
  };

  const handleAddKnowledge = async () => {
    const res = await fetch('/api/admin/training', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newKnowledge),
    });

    if (res.ok) {
      alert('Knowledge added successfully!');
      setNewKnowledge({ agentId: '', dataType: 'knowledge_base', description: '', data: '' });
      const updatedData = await fetch(`/api/admin?tab=training`).then((res) => res.json());
      setData(updatedData);
    } else {
      alert('Failed to add knowledge.');
    }
  };

  const handleSendMessage = async () => {
    if (!selectedAgent) {
      alert('Please select an agent to chat with.');
      return;
    }

    const agentRes = await fetch(`/api/admin/agents/${selectedAgent}`);
    const agentData = await agentRes.json();

    const trainingRes = await fetch(`/api/admin/training?agentId=${selectedAgent}`);
    const trainingData = await trainingRes.json();

    const prompt = `
      You are ${agentData.agentName}, a ${agentData.Role} at Business Wise365.
      Your role is: ${agentData.RoleInfo}.
      You are described as: ${agentData.personality}.
      Here are your tasks: ${agentData.tasks.join(', ')}.
      Your knowledge base includes: ${trainingData.map((data) => data.data).join(' ')}.
      Respond to the following user message: "${chatInput}"`;

    const res = await fetch('/api/admin/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (res.ok) {
      const { reply } = await res.json();
      const userMessage = { user: chatInput, timestamp: new Date() };
      const botMessage = { bot: reply, timestamp: new Date() };
      setChatMessages((prev) => [...prev, userMessage, botMessage]);

      await fetch('/api/admin/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent,
          messages: [userMessage, botMessage],
          participants: ['admin', selectedAgent],
        }),
      });

      setChatInput('');
    } else {
      alert('Failed to send message.');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'agents':
        return (
          <div>
            <h2 className="text-xl font-bold mb-4">Manage Agents</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.isArray(data) && data.length > 0 ? (
                data.map((agent) => (
                  <AgentCard
                    key={agent.agentId}
                    agent={agent}
                    onEdit={() => setEditingAgent(agent)}
                  />
                ))
              ) : (
                <p className="text-gray-500">No agents available. Add a new agent below.</p>
              )}
            </div>

            {editingAgent && (
              <div className="p-4 bg-white shadow rounded mt-6">
                <h3 className="text-lg font-bold mb-2">Edit Agent: {editingAgent.agentName}</h3>
                <input
                  type="text"
                  className="p-2 border rounded w-full mb-2"
                  placeholder="Agent Name"
                  value={editingAgent.agentName}
                  onChange={(e) =>
                    setEditingAgent({ ...editingAgent, agentName: e.target.value })
                  }
                />
                <input
                  type="text"
                  className="p-2 border rounded w-full mb-2"
                  placeholder="Role"
                  value={editingAgent.Role}
                  onChange={(e) =>
                    setEditingAgent({ ...editingAgent, Role: e.target.value })
                  }
                />
                <textarea
                  className="p-2 border rounded w-full mb-2"
                  placeholder="Role Info"
                  value={editingAgent.RoleInfo}
                  onChange={(e) =>
                    setEditingAgent({ ...editingAgent, RoleInfo: e.target.value })
                  }
                />
                <input
                  type="text"
                  className="p-2 border rounded w-full mb-2"
                  placeholder="Type"
                  value={editingAgent.Type}
                  onChange={(e) =>
                    setEditingAgent({ ...editingAgent, Type: e.target.value })
                  }
                />
                <textarea
                  className="p-2 border rounded w-full mb-2"
                  placeholder="Personality"
                  value={editingAgent.personality}
                  onChange={(e) =>
                    setEditingAgent({ ...editingAgent, personality: e.target.value })
                  }
                />
                <div className="flex space-x-4">
                  <button
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    onClick={handleEditAgent}
                  >
                    Save Changes
                  </button>
                  <button
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    onClick={() => setEditingAgent(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="p-4 bg-white shadow rounded mt-6">
              <h3 className="text-lg font-bold mb-2">Add New Agent</h3>
              <input
                type="text"
                className="p-2 border rounded w-full mb-2"
                placeholder="Agent ID (e.g., mike)"
                value={newAgent.agentId}
                onChange={(e) => setNewAgent({ ...newAgent, agentId: e.target.value })}
              />
              {/* Other fields */}
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={handleAddAgent}
              >
                Add Agent
              </button>
            </div>
          </div>
        );

      case 'training':
        return (
          <div>
            {/* Training UI */}
          </div>
        );

      default:
        return <div>Unknown Tab</div>;
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
      </div>
      {renderContent()}
    </AdminLayout>
  );
}
