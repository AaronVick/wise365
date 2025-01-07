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
        About: '',
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
          {/* Agents List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.map((agent) => (
              <AgentCard
                key={agent.agentId}
                agent={agent}
                onEdit={() => setEditingAgent(agent)}
              />
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === 'training') {
      useEffect(() => {
        async function fetchAgents() {
          try {
            const res = await fetch('/api/admin/agents'); // Fetch agents from Firebase
            if (!res.ok) throw new Error('Failed to fetch agents');
            const agentsData = await res.json();
            setAgents(agentsData || []); // Update the state with the fetched agents
          } catch (error) {
            console.error('Error fetching agents:', error);
          }
        }
    
        fetchAgents();
      }, []);
    
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      useEffect(() => {
        async function fetchAgents() {
          try {
            const res = await fetch('/api/admin/agents'); // Fetch agents from Firebase
            if (!res.ok) throw new Error('Failed to fetch agents');
            const agentsData = await res.json();
            setAgents(agentsData || []); // Update the state with the fetched agents
          } catch (error) {
            console.error('Error fetching agents:', error);
          }
        }
    
        fetchAgents();
      }, []);
    
      return (
        <div>
          <h2 className="text-xl font-bold mb-4">Chat with Agents</h2>
          {/* Chat Dropdown */}
          <select
            className="p-2 border rounded w-full mb-4"
            value={selectedAgent || ''}
            onChange={async (e) => {
              const agentId = e.target.value;
              setSelectedAgent(agentId);
              try {
                const res = await fetch(`/api/admin/conversations?agentId=${agentId}`);
                if (!res.ok) throw new Error('Failed to fetch conversation data');
                const conversationData = await res.json();
                setChatMessages(conversationData.messages || []);
              } catch (error) {
                console.error('Error fetching conversation data:', error);
                setChatMessages([]); // Fallback to an empty array if fetching fails
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
