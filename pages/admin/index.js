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
    About: '',
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

  // Fetch agents and tab-specific data
  useEffect(() => {
    async function fetchData() {
      if (activeTab === 'agents') {
        const res = await fetch('/api/admin?tab=agents');
        const result = await res.json();
        setData(result || []);
      } else {
        const agentsRes = await fetch('/api/admin/agents');
        const agentsData = await agentsRes.json();
        setAgents(agentsData || []);
      }

      if (activeTab === 'training') {
        const res = await fetch('/api/admin?tab=training');
        const result = await res.json();
        setData(result || []);
      }

      if (activeTab === 'chat') {
        setChatMessages([]); // Clear messages when switching to chat tab
      }
    }
    fetchData();
  }, [activeTab]);

  const handleAgentSelection = async (agentId) => {
    setSelectedAgent(agentId);
    if (activeTab === 'chat') {
      try {
        const res = await fetch(`/api/admin/conversations?agentId=${agentId}`);
        if (!res.ok) throw new Error('Failed to fetch conversation data');
        const conversationData = await res.json();
        setChatMessages(conversationData.messages || []);
      } catch (error) {
        console.error('Error fetching conversation data:', error);
        setChatMessages([]); // Fallback to an empty array
      }
    }
  };

  // Handlers for agent management, adding knowledge, and chat functionality remain the same

 const renderContent = () => {
  if (activeTab === 'agents') {
    return (
      <div>
        <h2 className="text-xl font-bold mb-4">Manage Agents</h2>

        {/* Agents Table */}
        <div className="overflow-x-auto">
          <table className="table-auto w-full bg-white shadow rounded mb-6">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-4 text-left">Agent ID</th>
                <th className="p-4 text-left">Agent Name</th>
                <th className="p-4 text-left">Role</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((agent, index) => (
                <tr
                  key={agent.agentId}
                  className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                >
                  <td className="p-4">{agent.agentId}</td>
                  <td className="p-4">{agent.agentName}</td>
                  <td className="p-4">{agent.Role}</td>
                  <td className="p-4">
                    <button
                      onClick={() => setEditingAgent(agent)}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Edit Agent Section */}
        {editingAgent && (
          <div className="p-4 bg-white shadow rounded mt-6">
            <h3 className="text-lg font-semibold mb-4">
              Edit Agent: {editingAgent.agentName}
            </h3>
            <input
              type="text"
              placeholder="Agent Name"
              value={editingAgent.agentName}
              onChange={(e) =>
                setEditingAgent({ ...editingAgent, agentName: e.target.value })
              }
              className="p-2 border rounded w-full mb-2"
            />
            <input
              type="text"
              placeholder="Role"
              value={editingAgent.Role}
              onChange={(e) => setEditingAgent({ ...editingAgent, Role: e.target.value })}
              className="p-2 border rounded w-full mb-2"
            />
            <textarea
              placeholder="Role Info"
              value={editingAgent.RoleInfo}
              onChange={(e) =>
                setEditingAgent({ ...editingAgent, RoleInfo: e.target.value })
              }
              className="p-2 border rounded w-full mb-2"
            />
            <input
              type="text"
              placeholder="Type"
              value={editingAgent.Type}
              onChange={(e) => setEditingAgent({ ...editingAgent, Type: e.target.value })}
              className="p-2 border rounded w-full mb-2"
            />
            <input
              type="text"
              placeholder="Language"
              value={editingAgent.language}
              onChange={(e) =>
                setEditingAgent({ ...editingAgent, language: e.target.value })
              }
              className="p-2 border rounded w-full mb-2"
            />
            <textarea
              placeholder="Personality"
              value={editingAgent.personality}
              onChange={(e) =>
                setEditingAgent({ ...editingAgent, personality: e.target.value })
              }
              className="p-2 border rounded w-full mb-2"
            />
            <textarea
              placeholder="About"
              value={editingAgent.About}
              onChange={(e) => setEditingAgent({ ...editingAgent, About: e.target.value })}
              className="p-2 border rounded w-full mb-2"
            />
            <button
              onClick={async () => {
                try {
                  await fetch(`/api/admin/agents/${editingAgent.agentId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(editingAgent),
                  });
                  alert('Agent updated successfully!');
                  setEditingAgent(null); // Close the editing section
                  // Refresh the agents list
                  const updatedData = await fetch('/api/admin?tab=agents').then((res) =>
                    res.json()
                  );
                  setData(updatedData);
                } catch (error) {
                  console.error('Error updating agent:', error);
                  alert('Failed to update agent.');
                }
              }}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 mr-2"
            >
              Save Changes
            </button>
            <button
              onClick={() => setEditingAgent(null)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Add New Agent Section */}
        <div className="p-4 bg-white shadow rounded mt-6">
          <h3 className="text-lg font-semibold mb-4">Add New Agent</h3>
          <input
            type="text"
            placeholder="Agent ID"
            value={newAgent.agentId}
            onChange={(e) => setNewAgent({ ...newAgent, agentId: e.target.value })}
            className="p-2 border rounded w-full mb-2"
          />
          <input
            type="text"
            placeholder="Agent Name"
            value={newAgent.agentName}
            onChange={(e) => setNewAgent({ ...newAgent, agentName: e.target.value })}
            className="p-2 border rounded w-full mb-2"
          />
          <input
            type="text"
            placeholder="Role"
            value={newAgent.Role}
            onChange={(e) => setNewAgent({ ...newAgent, Role: e.target.value })}
            className="p-2 border rounded w-full mb-2"
          />
          <textarea
            placeholder="Role Info"
            value={newAgent.RoleInfo}
            onChange={(e) => setNewAgent({ ...newAgent, RoleInfo: e.target.value })}
            className="p-2 border rounded w-full mb-2"
          />
          <input
            type="text"
            placeholder="Type"
            value={newAgent.Type}
            onChange={(e) => setNewAgent({ ...newAgent, Type: e.target.value })}
            className="p-2 border rounded w-full mb-2"
          />
          <input
            type="text"
            placeholder="Language"
            value={newAgent.language}
            onChange={(e) => setNewAgent({ ...newAgent, language: e.target.value })}
            className="p-2 border rounded w-full mb-2"
          />
          <textarea
            placeholder="Personality"
            value={newAgent.personality}
            onChange={(e) => setNewAgent({ ...newAgent, personality: e.target.value })}
            className="p-2 border rounded w-full mb-2"
          />
          <textarea
            placeholder="About"
            value={newAgent.About}
            onChange={(e) => setNewAgent({ ...newAgent, About: e.target.value })}
            className="p-2 border rounded w-full mb-2"
          />
          <button
            onClick={handleAddAgent}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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

      {/* Training Dropdown */}
      <select
        className="p-2 border rounded w-full mb-4"
        value={selectedAgent || ''}
        onChange={async (e) => {
          const agentId = e.target.value;
          setSelectedAgent(agentId);
          try {
            const res = await fetch(`/api/admin/training?agentId=${agentId}`);
            if (!res.ok) throw new Error('Failed to fetch training data');
            const trainingData = await res.json();
            setData(trainingData || []);
          } catch (error) {
            console.error('Error fetching training data:', error);
            setData([]); // Fallback to an empty array if fetching fails
          }
        }}
      >
        <option value="" disabled>
          Select an Agent
        </option>
        {agents.length > 0 ? (
          agents.map((agent) => (
            <option key={agent.agentId} value={agent.agentId}>
              {agent.agentName}
            </option>
          ))
        ) : (
          <option disabled>No agents available</option>
        )}
      </select>

      {/* Display Training Data */}
      {selectedAgent && data.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((training, index) => (
            <div key={index} className="p-4 bg-gray-100 shadow rounded">
              <h3 className="text-lg font-semibold">{training.dataType}</h3>
              <p className="text-sm text-gray-600">{training.description}</p>
              {training.data?.qa && (
                <div className="mt-4">
                  <h4 className="text-md font-bold">Q&A:</h4>
                  {training.data.qa.map((qaItem, idx) => (
                    <div key={idx} className="p-2 bg-gray-200 rounded mb-2">
                      <p>
                        <strong>Question:</strong> {qaItem.question}
                      </p>
                      <p>
                        <strong>Guidance:</strong> {qaItem.guidance}
                      </p>
                      <p>
                        <strong>Feedback Example:</strong> {qaItem.feedbackExample}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">
          {selectedAgent
            ? 'No training data found for the selected agent.'
            : 'Please select an agent to view their training data.'}
        </p>
      )}
    </div>
  );
}


if (activeTab === 'chat') {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Chat with Agents</h2>

      {/* Chat Dropdown */}
      <select
        className="p-2 border rounded w-full mb-4"
        value={selectedAgent || ''}
        onChange={(e) => handleAgentSelection(e.target.value)}
      >
        <option value="" disabled>
          Select an Agent
        </option>
        {agents.length > 0 ? (
          agents.map((agent) => (
            <option key={agent.agentId} value={agent.agentId}>
              {agent.agentName}
            </option>
          ))
        ) : (
          <option disabled>No agents available</option>
        )}
      </select>

      {/* Chat Messages */}
      <div className="p-4 bg-gray-100 shadow rounded mb-4">
        {selectedAgent && chatMessages.length > 0 ? (
          chatMessages.map((msg, idx) => (
            <div key={idx} className="mb-2">
              <p>
                <strong>You:</strong> {msg.user}
              </p>
              <p>
                <strong>{agents.find((agent) => agent.agentId === selectedAgent)?.agentName || 'Bot'}:</strong> {msg.bot}
              </p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">
            {selectedAgent
              ? 'No messages yet. Start the conversation!'
              : 'Please select an agent to view chat history.'}
          </p>
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
          onClick={async () => {
            if (!selectedAgent) {
              alert('Please select an agent to chat with.');
              return;
            }

            const prompt = `You are chatting with ${selectedAgent}. Respond to the following message: "${chatInput}"`;

            try {
              const res = await fetch('/api/admin/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentId: selectedAgent, prompt }),
              });
              if (!res.ok) throw new Error('Failed to send message');
              const { reply } = await res.json();

              const userMessage = { user: chatInput, timestamp: new Date() };
              const botMessage = { bot: reply, timestamp: new Date() };

              setChatMessages((prev) => [...prev, userMessage, botMessage]);
              setChatInput('');

              // Save conversation to the Firebase collection
              await fetch('/api/admin/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  agentId: selectedAgent,
                  messages: [userMessage, botMessage],
                }),
              });
            } catch (error) {
              console.error('Error sending message:', error);
              alert('Failed to send message. Please try again.');
            }
          }}
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
