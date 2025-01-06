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
        const agentsRes = await fetch('/api/admin/agents');
        const agentsData = await agentsRes.json();
        setAgents(agentsData || []);
      }
    }
    fetchData();
  }, [activeTab]);

  // Add new agent
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
      const updatedData = await fetch('/api/admin?tab=agents').then((res) => res.json());
      setData(updatedData);
    } else {
      alert('Failed to add agent.');
    }
  };

  // Edit existing agent
  const handleEditAgent = async () => {
    const res = await fetch(`/api/admin/agents/${editingAgent.agentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingAgent),
    });

    if (res.ok) {
      alert('Agent updated successfully!');
      setEditingAgent(null);
      const updatedData = await fetch('/api/admin?tab=agents').then((res) => res.json());
      setData(updatedData);
    } else {
      alert('Failed to update agent.');
    }
  };

  // Add new knowledge
  const handleAddKnowledge = async () => {
    const res = await fetch('/api/admin/training', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newKnowledge),
    });

    if (res.ok) {
      alert('Knowledge added successfully!');
      setNewKnowledge({ agentId: '', dataType: 'knowledge_base', description: '', data: '' });
      const updatedData = await fetch('/api/admin?tab=training').then((res) => res.json());
      setData(updatedData);
    } else {
      alert('Failed to add knowledge.');
    }
  };

  // Send a chat message
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

      setChatInput('');
    } else {
      alert('Failed to send message.');
    }
  };

  const renderContent = () => {
    if (activeTab === 'agents') {
      return (
        <div>
          <h2 className="text-xl font-bold mb-4">Manage Agents</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.map((agent) => (
              <AgentCard
                key={agent.agentId}
                agent={agent}
                onEdit={() => setEditingAgent(agent)}
              />
            ))}
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
              {/* Add other fields */}
              <div className="flex space-x-4">
                <button
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  onClick={handleEditAgent}
                >
                  Save
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
        </div>
      );
    }

    if (activeTab === 'training') {
      return (
        <div>
          <h2 className="text-xl font-bold mb-4">Training Data</h2>
          <select
            className="p-2 border rounded w-full mb-4"
            value={selectedAgent || ''}
            onChange={async (e) => {
              const agentId = e.target.value;
              setSelectedAgent(agentId);
              const res = await fetch(`/api/admin/training?agentId=${agentId}`);
              const trainingData = await res.json();
              setData(trainingData);
            }}
          >
            <option value="" disabled>Select an Agent</option>
            {agents.map((agent) => (
              <option key={agent.agentId} value={agent.agentId}>
                {agent.agentName}
              </option>
            ))}
          </select>
          {/* Display training data */}
        </div>
      );
    }

    if (activeTab === 'chat') {
      return (
        <div>
          <h2 className="text-xl font-bold mb-4">Chat with Agents</h2>
          <select
            className="p-2 border rounded w-full mb-4"
            value={selectedAgent || ''}
            onChange={(e) => setSelectedAgent(e.target.value)}
          >
            <option value="" disabled>Select an Agent</option>
            {agents.map((agent) => (
              <option key={agent.agentId} value={agent.agentId}>
                {agent.agentName}
              </option>
            ))}
          </select>
          <div className="p-4 bg-gray-100 shadow rounded mb-4">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className="mb-2">
                <p><strong>You:</strong> {msg.user}</p>
                <p><strong>{selectedAgent}:</strong> {msg.bot}</p>
              </div>
            ))}
          </div>
          <div className="flex">
            <input
              type="text"
              className="p-2 border rounded w-full mr-2"
              placeholder="Type a message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={handleSendMessage}
            >
              Send
            </button>
          </div>
        </div>
      );
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
