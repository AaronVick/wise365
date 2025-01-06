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
          
          {/* Agent Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.map((agent) => (
              <AgentCard
                key={agent.agentId}
                agent={agent}
                onEdit={() => setEditingAgent(agent)}
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
              <input
                type="text"
                className="p-2 border rounded w-full mb-2"
                placeholder="Language"
                value={editingAgent.language}
                onChange={(e) =>
                  setEditingAgent({ ...editingAgent, language: e.target.value })
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
              <textarea
                className="p-2 border rounded w-full mb-2"
                placeholder="About"
                value={editingAgent.About}
                onChange={(e) =>
                  setEditingAgent({ ...editingAgent, About: e.target.value })
                }
              />
              <div className="mb-4">
                <h4 className="text-md font-bold mb-2">Tasks</h4>
                {editingAgent.tasks.map((task, idx) => (
                  <div key={idx} className="flex items-center mb-2">
                    <input
                      type="text"
                      className="p-2 border rounded w-full"
                      value={task}
                      onChange={(e) => {
                        const updatedTasks = [...editingAgent.tasks];
                        updatedTasks[idx] = e.target.value;
                        setEditingAgent({ ...editingAgent, tasks: updatedTasks });
                      }}
                    />
                    <button
                      className="ml-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      onClick={() => {
                        const updatedTasks = editingAgent.tasks.filter((_, tIdx) => tIdx !== idx);
                        setEditingAgent({ ...editingAgent, tasks: updatedTasks });
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={() => {
                    const updatedTasks = [...editingAgent.tasks, ''];
                    setEditingAgent({ ...editingAgent, tasks: updatedTasks });
                  }}
                >
                  Add Task
                </button>
              </div>
              <div className="flex space-x-4">
                <button
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  onClick={async () => {
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
                  }}
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
    
          {/* Add New Agent Form */}
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
            <input
              type="text"
              className="p-2 border rounded w-full mb-2"
              placeholder="Language"
              value={newAgent.language}
              onChange={(e) => setNewAgent({ ...newAgent, language: e.target.value })}
            />
            <textarea
              className="p-2 border rounded w-full mb-2"
              placeholder="Personality"
              value={newAgent.personality}
              onChange={(e) => setNewAgent({ ...newAgent, personality: e.target.value })}
            />
            <textarea
              className="p-2 border rounded w-full mb-2"
              placeholder="About"
              value={newAgent.About}
              onChange={(e) => setNewAgent({ ...newAgent, About: e.target.value })}
            />
            <div className="mb-4">
              <h4 className="text-md font-bold mb-2">Tasks</h4>
              {newAgent.tasks.map((task, idx) => (
                <div key={idx} className="flex items-center mb-2">
                  <input
                    type="text"
                    className="p-2 border rounded w-full"
                    value={task}
                    onChange={(e) => {
                      const updatedTasks = [...newAgent.tasks];
                      updatedTasks[idx] = e.target.value;
                      setNewAgent({ ...newAgent, tasks: updatedTasks });
                    }}
                  />
                  <button
                    className="ml-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    onClick={() => {
                      const updatedTasks = newAgent.tasks.filter((_, tIdx) => tIdx !== idx);
                      setNewAgent({ ...newAgent, tasks: updatedTasks });
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => {
                  const updatedTasks = [...newAgent.tasks, ''];
                  setNewAgent({ ...newAgent, tasks: updatedTasks });
                }}
              >
                Add Task
              </button>
            </div>
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
    if (activeTab === 'training') {
      useEffect(() => {
        async function fetchAgents() {
          const res = await fetch('/api/admin/agents'); // Adjust the endpoint to fetch agents
          const agentsData = await res.json();
          setAgents(agentsData || []);
        }
    
        fetchAgents();
      }, []);
    
      return (
        <div>
          <h2 className="text-xl font-bold mb-4">Training Data</h2>
    
          {/* Agent Selection Dropdown */}
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
            {agents && agents.length > 0 ? (
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
          {selectedAgent ? (
            data.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {data.map((training) => (
                  <div key={training.id} className="p-4 bg-gray-100 shadow rounded">
                    <h3 className="text-lg font-semibold">{training.dataType}</h3>
                    <p className="text-sm text-gray-600">{training.description}</p>
                    {training.data.qa && (
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
              <p className="text-gray-600">No training data found for this agent.</p>
            )
          ) : (
            <p className="text-gray-600">Please select an agent to view their training data.</p>
          )}
        </div>
      );
    }
    if (activeTab === 'chat') {
      useEffect(() => {
        async function fetchAgents() {
          const res = await fetch('/api/admin/agents'); // Endpoint to fetch agents
          const agentsData = await res.json();
          setAgents(agentsData || []);
        }
    
        fetchAgents();
      }, []);
    
      return (
        <div>
          <h2 className="text-xl font-bold mb-4">Chat with Agents</h2>
    
          {/* Agent Selection Dropdown */}
          <select
            className="p-2 border rounded w-full mb-4"
            value={selectedAgent || ''}
            onChange={async (e) => {
              const agentId = e.target.value;
              setSelectedAgent(agentId);
    
              // Fetch existing chat messages for the selected agent
              const res = await fetch(`/api/admin/conversations?agentId=${agentId}`);
              if (res.ok) {
                const conversationData = await res.json();
                setChatMessages(conversationData.messages || []);
              } else {
                setChatMessages([]); // No conversations started yet
              }
            }}
          >
            <option value="" disabled>
              Select an Agent
            </option>
            {agents && agents.length > 0 ? (
              agents.map((agent) => (
                <option key={agent.agentId} value={agent.agentId}>
                  {agent.agentName}
                </option>
              ))
            ) : (
              <option disabled>No agents available</option>
            )}
          </select>
    
          {/* Chat Messages Section */}
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
