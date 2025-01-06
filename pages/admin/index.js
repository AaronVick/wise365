import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import AgentCard from '@/components/AgentCard';

export default function AdminDashboard() {
  const [data, setData] = useState([]);
  const [activeTab, setActiveTab] = useState('agents');
  const [newKnowledge, setNewKnowledge] = useState({
    agentId: '',
    dataType: 'knowledge_base',
    description: '',
    data: '',
  });
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);

  // Fetch tab-specific data
  useEffect(() => {
    async function fetchData() {
      const res = await fetch(`/api/admin?tab=${activeTab}`);
      const result = await res.json();
      setData(result);
    }
    fetchData();
  }, [activeTab]);

  // Add new knowledge to agentData
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

  // Handle chat message sending
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

  // Render content for each tab
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
                onEdit={(agent) => alert(`Edit agent: ${agent.agentName}`)}
              />
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === 'training') {
      return (
        <div>
          <h2 className="text-xl font-bold mb-4">Training Data</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {data.map((training) => (
              <div key={training.id} className="p-4 bg-gray-100 shadow rounded">
                <h3 className="text-lg font-semibold">{training.dataType}</h3>
                <p className="text-sm text-gray-600">{training.description}</p>
              </div>
            ))}
          </div>
          <div className="p-4 bg-white shadow rounded">
            <h3 className="text-lg font-bold mb-2">Add New Knowledge</h3>
            <input
              type="text"
              className="p-2 border rounded w-full mb-2"
              placeholder="Agent ID (e.g., mike)"
              value={newKnowledge.agentId}
              onChange={(e) => setNewKnowledge({ ...newKnowledge, agentId: e.target.value })}
            />
            <textarea
              className="p-2 border rounded w-full mb-2"
              placeholder="Description of the knowledge"
              value={newKnowledge.description}
              onChange={(e) => setNewKnowledge({ ...newKnowledge, description: e.target.value })}
            />
            <textarea
              className="p-2 border rounded w-full mb-2"
              placeholder="Knowledge data (e.g., facts, context)"
              value={newKnowledge.data}
              onChange={(e) => setNewKnowledge({ ...newKnowledge, data: e.target.value })}
            />
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={handleAddKnowledge}
            >
              Add Knowledge
            </button>
          </div>
        </div>
      );
    }

    if (activeTab === 'chat') {
      return (
        <div>
          <h2 className="text-xl font-bold mb-4">Chat with Agents</h2>
          <div className="mb-4">
            <select
              className="p-2 border rounded w-full"
              value={selectedAgent || ''}
              onChange={(e) => setSelectedAgent(e.target.value)}
            >
              <option value="" disabled>
                Select an agent
              </option>
              {data.map((agent) => (
                <option key={agent.agentId} value={agent.agentId}>
                  {agent.agentName}
                </option>
              ))}
            </select>
          </div>
          <div className="p-4 bg-gray-100 shadow rounded mb-4">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className="mb-2">
                <p>
                  <strong>You:</strong> {msg.user}
                </p>
                <p>
                  <strong>{selectedAgent}:</strong> {msg.bot}
                </p>
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

    return <div>Other Tab Content Here</div>;
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
