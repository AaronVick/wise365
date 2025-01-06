import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import AgentCard from '@/components/AgentCard';

export default function AdminDashboard() {
  const [data, setData] = useState([]);
  const [activeTab, setActiveTab] = useState('agents');
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
      const updatedData = await fetch(`/api/admin?tab=agents`).then((res) => res.json());
      setData(updatedData);
    } else {
      alert('Failed to add agent.');
    }
  };

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

  // Send message in chat
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

  // Render content based on the active tab
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
              onEdit={() => setEditingAgent(agent)} // Open the edit form
            />
          ))}
        </div>

        {/* Edit Agent Form */}
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
              onChange={(e) => setEditingAgent({ ...editingAgent, Role: e.target.value })}
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
              onChange={(e) => setEditingAgent({ ...editingAgent, Type: e.target.value })}
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
                onClick={handleSaveAgent}
              >
                Save
              </button>
              <button
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                onClick={() => setEditingAgent(null)} // Cancel editing
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Add New Agent */}
        <div className="p-4 bg-white shadow rounded mt-6">
          <h3 className="text-lg font-bold mb-2">Add New Agent</h3>
          <input
            type="text"
            className="p-2 border rounded w-full mb-2"
            placeholder="Agent ID (e.g., mike)"
            value={newAgent.agentId}
            onChange={(e) => setNewAgent({ ...newAgent, agentId: e.target.value })}
          />
          <input
            type="text"
            className="p-2 border rounded w-full mb-2"
            placeholder="Agent Name"
            value={newAgent.agentName}
            onChange={(e) => setNewAgent({ ...newAgent, agentName: e.target.value })}
          />
          <input
            type="text"
            className="p-2 border rounded w-full mb-2"
            placeholder="Role"
            value={newAgent.Role}
            onChange={(e) => setNewAgent({ ...newAgent, Role: e.target.value })}
          />
          <textarea
            className="p-2 border rounded w-full mb-2"
            placeholder="Role Info"
            value={newAgent.RoleInfo}
            onChange={(e) => setNewAgent({ ...newAgent, RoleInfo: e.target.value })}
          />
          <input
            type="text"
            className="p-2 border rounded w-full mb-2"
            placeholder="Type"
            value={newAgent.Type}
            onChange={(e) => setNewAgent({ ...newAgent, Type: e.target.value })}
          />
          <textarea
            className="p-2 border rounded w-full mb-2"
            placeholder="Personality"
            value={newAgent.personality}
            onChange={(e) => setNewAgent({ ...newAgent, personality: e.target.value })}
          />
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={handleAddAgent}
          >
            Add Agent
          </button>
        </div>
      </div>
    );
  }
};


if (activeTab === 'training') {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Training Data</h2>
      
      {/* Agent Selection */}
      <select
        className="p-2 border rounded w-full mb-4"
        value={selectedAgent || ''}
        onChange={async (e) => {
          const agentId = e.target.value;
          setSelectedAgent(agentId);
          
          // Fetch training data for the selected agent
          const res = await fetch(`/api/admin/training?agentId=${agentId}`);
          const trainingData = await res.json();
          setData(trainingData);
        }}
      >
        <option value="" disabled>
          Select an Agent
        </option>
        {agents.map((agent) => (
          <option key={agent.agentId} value={agent.agentId}>
            {agent.agentName}
          </option>
        ))}
      </select>

      {/* Display Existing Training Data */}
      {selectedAgent ? (
        data.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {data.map((training) => (
              <div key={training.id} className="p-4 bg-gray-100 shadow rounded">
                <h3 className="text-lg font-semibold">{training.dataType}</h3>
                <p className="text-sm text-gray-600">{training.description}</p>
                {/* Render nested Q&A or sections */}
                {training.data.qa && (
                  <div className="mt-4">
                    <h4 className="text-md font-bold">Q&A:</h4>
                    {training.data.qa.map((qaItem, idx) => (
                      <div key={idx} className="p-2 bg-gray-200 rounded mb-2">
                        <p><strong>Question:</strong> {qaItem.question}</p>
                        <p><strong>Guidance:</strong> {qaItem.guidance}</p>
                        <p><strong>Feedback Example:</strong> {qaItem.feedbackExample}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No training data found for this agent.</p>
        )
      ) : (
        <p className="text-gray-600">Please select an agent to view their training data.</p>
      )}
      
      {/* Add New Knowledge Form */}
      <div className="p-4 bg-white shadow rounded mt-6">
        <h3 className="text-lg font-bold mb-2">Add New Knowledge</h3>
        
        {/* Agent Dropdown */}
        <select
          className="p-2 border rounded w-full mb-2"
          value={newKnowledge.agentId}
          onChange={(e) => setNewKnowledge({ ...newKnowledge, agentId: e.target.value })}
        >
          <option value="" disabled>
            Select an Agent
          </option>
          {agents.map((agent) => (
            <option key={agent.agentId} value={agent.agentId}>
              {agent.agentName}
            </option>
          ))}
        </select>
        
        <textarea
          className="p-2 border rounded w-full mb-2"
          placeholder="Description of the knowledge"
          value={newKnowledge.description}
          onChange={(e) => setNewKnowledge({ ...newKnowledge, description: e.target.value })}
        />
        
        {/* Add Q&A Section */}
        <div className="mb-4">
          <h4 className="text-md font-bold mb-2">Add Q&A</h4>
          {newKnowledge.data.qa?.map((qa, idx) => (
            <div key={idx} className="mb-2 p-2 bg-gray-100 rounded">
              <input
                type="text"
                className="p-2 border rounded w-full mb-2"
                placeholder="Question"
                value={qa.question}
                onChange={(e) => {
                  const updatedQa = [...newKnowledge.data.qa];
                  updatedQa[idx].question = e.target.value;
                  setNewKnowledge({ ...newKnowledge, data: { ...newKnowledge.data, qa: updatedQa } });
                }}
              />
              <textarea
                className="p-2 border rounded w-full mb-2"
                placeholder="Guidance"
                value={qa.guidance}
                onChange={(e) => {
                  const updatedQa = [...newKnowledge.data.qa];
                  updatedQa[idx].guidance = e.target.value;
                  setNewKnowledge({ ...newKnowledge, data: { ...newKnowledge.data, qa: updatedQa } });
                }}
              />
              <textarea
                className="p-2 border rounded w-full mb-2"
                placeholder="Feedback Example"
                value={qa.feedbackExample}
                onChange={(e) => {
                  const updatedQa = [...newKnowledge.data.qa];
                  updatedQa[idx].feedbackExample = e.target.value;
                  setNewKnowledge({ ...newKnowledge, data: { ...newKnowledge.data, qa: updatedQa } });
                }}
              />
            </div>
          ))}
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => {
              const updatedQa = newKnowledge.data.qa || [];
              updatedQa.push({ question: '', guidance: '', feedbackExample: '' });
              setNewKnowledge({ ...newKnowledge, data: { ...newKnowledge.data, qa: updatedQa } });
            }}
          >
            Add Q&A
          </button>
        </div>
        
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
            {/* Agent Dropdown */}
            <select
              className="p-2 border rounded w-full"
              value={selectedAgent || ''}
              onChange={(e) => setSelectedAgent(e.target.value)}
            >
              <option value="" disabled>
                Select an agent
              </option>
              {Array.isArray(data) && data.length > 0 ? (
                data.map((agent) => (
                  <option key={agent.agentId} value={agent.agentId}>
                    {agent.agentName}
                  </option>
                ))
              ) : (
                <option disabled>No agents available</option>
              )}
            </select>
          </div>
    
          {/* Chat Messages */}
          <div className="p-4 bg-gray-100 shadow rounded mb-4">
            {chatMessages && chatMessages.length > 0 ? (
              chatMessages.map((msg, idx) => (
                <div key={idx} className="mb-2">
                  <p>
                    <strong>You:</strong> {msg.user}
                  </p>
                  <p>
                    <strong>{selectedAgent}:</strong> {msg.bot}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            )}
          </div>
    
          {/* Chat Input */}
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
