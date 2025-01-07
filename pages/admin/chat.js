import { useState, useEffect, useRef } from 'react';

export default function Chat() {
  const [agents, setAgents] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentPersona, setAgentPersona] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const messagesEndRef = useRef(null);

  // ... (keep existing useEffect for scrollToBottom)

  // Fetch agents and conversations on mount
  useEffect(() => {
    async function fetchInitialData() {
      setLoading(true);
      setError(null);
      try {
        // Fetch agents
        const agentsRes = await fetch('/api/admin?tab=agents');
        if (!agentsRes.ok) throw new Error('Failed to fetch agents');
        const agentsData = await agentsRes.json();
        setAgents(agentsData || []);

        // Fetch all conversations
        const conversationsRes = await fetch('/api/admin?tab=conversations');
        if (!conversationsRes.ok) throw new Error('Failed to fetch conversations');
        const conversationsData = await conversationsRes.json();
        setConversations(conversationsData || []);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setError('Failed to load initial data');
      } finally {
        setLoading(false);
      }
    }
    fetchInitialData();
  }, []);

  // Handle agent and conversation selection
  useEffect(() => {
    if (!selectedAgent) {
      setAgentPersona(null);
      setChatMessages([]);
      return;
    }

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        // Fetch agent training data
        const trainingRes = await fetch(`/api/admin?tab=training&agentId=${selectedAgent}`);
        if (!trainingRes.ok) throw new Error('Failed to fetch agent training data');
        const trainingData = await trainingRes.json();
        const personalityData = trainingData.find(data => data.dataType === 'personality');
        setAgentPersona(personalityData || null);

        // If a conversation is selected, fetch its messages
        if (selectedConversation) {
          const messages = selectedConversation.messages.map(msg => {
            try {
              const msgObj = JSON.parse(`{${msg}}`);
              return {
                user: msgObj.role === 'admin' ? msgObj.content : null,
                bot: msgObj.role === selectedAgent ? msgObj.content : null
              };
            } catch (e) {
              console.error('Error parsing message:', msg, e);
              return null;
            }
          }).filter(msg => msg !== null && (msg.user || msg.bot));
          setChatMessages(messages);
        } else {
          // Find or create general chat for this agent
          const generalChat = conversations.find(c => 
            c.agentID === selectedAgent && !c.name && c.createdBy === 'admin'
          );
          if (generalChat) {
            setSelectedConversation(generalChat);
          } else {
            // Will create new general chat on first message
            setChatMessages([]);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedAgent, selectedConversation]);

  const handleCreateNewChat = async () => {
    if (!selectedAgent || !newChatName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/chat/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent,
          name: newChatName.trim(),
        }),
      });

      if (!res.ok) throw new Error('Failed to create new chat');
      
      const newChat = await res.json();
      setConversations(prev => [...prev, newChat]);
      setSelectedConversation(newChat);
      setNewChatName('');
      setShowNewChatModal(false);
    } catch (error) {
      setError('Failed to create new chat: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedAgent || !chatInput.trim()) {
      alert('Please select an agent and enter a message.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let systemPrompt = `You are ${selectedAgent}`;
      if (agentPersona) {
        // ... (keep existing prompt construction)
      }

      const res = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent,
          message: chatInput,
          prompt: systemPrompt,
          conversationId: selectedConversation?.id,
          isNewConversation: !selectedConversation
        }),
      });

      let data;
      const responseText = await res.text();
      
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Invalid response from server');
      }

      if (!res.ok || !data.reply) {
        throw new Error(data.error || 'Failed to send message');
      }

      // If this was a new conversation, update the conversations list
      if (data.conversationId && !selectedConversation) {
        const newConversation = {
          id: data.conversationId,
          agentID: selectedAgent,
          messages: [],
          createdBy: 'admin'
        };
        setConversations(prev => [...prev, newConversation]);
        setSelectedConversation(newConversation);
      }

      setChatMessages(prev => [...prev, { user: chatInput, bot: data.reply }]);
      setChatInput('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Chat with Agents</h2>
        <button
          onClick={() => setShowNewChatModal(true)}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          disabled={!selectedAgent}
        >
          New Chat
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <select
          className="p-2 border rounded col-span-2"
          value={selectedAgent || ''}
          onChange={(e) => {
            setSelectedAgent(e.target.value);
            setSelectedConversation(null);
          }}
          disabled={loading}
        >
          <option value="" disabled>
            {agents.length === 0 ? 'No agents available' : 'Select an Agent'}
          </option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.agentId}>
              {agent.agentName}: {agent.Role}
            </option>
          ))}
        </select>

        <select
          className="p-2 border rounded col-span-2"
          value={selectedConversation?.id || ''}
          onChange={(e) => {
            const conv = conversations.find(c => c.id === e.target.value);
            setSelectedConversation(conv || null);
          }}
          disabled={!selectedAgent || loading}
        >
          <option value="">General Chat</option>
          {conversations
            .filter(c => c.agentID === selectedAgent && c.name)
            .map((conv) => (
              <option key={conv.id} value={conv.id}>
                {conv.name}
              </option>
            ))}
        </select>
      </div>

      {agentPersona && (
  <div className="bg-blue-50 p-4 rounded mb-6">
    <h3 className="font-semibold mb-2">Agent Personality:</h3>
    <p>{agentPersona.description}</p>
    {agentPersona.data?.traits?.length > 0 && (
      <div className="mt-2">
        <strong>Traits:</strong> {agentPersona.data.traits.join(', ')}
      </div>
    )}
  </div>
)}

<div className="bg-white shadow rounded mb-6">
  <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
    {selectedAgent ? (
      <div>
        <p className="font-medium">
          Chatting with: {agents.find(a => a.agentId === selectedAgent)?.agentName}
        </p>
        {selectedConversation?.name && (
          <p className="text-sm text-gray-600">
            Chat: {selectedConversation.name}
          </p>
        )}
      </div>
    ) : (
      <p className="text-gray-500">Select an agent to start chatting</p>
    )}
  </div>

  <div className="p-4 h-[500px] overflow-y-auto">
    {chatMessages.map((msg, idx) => (
      <div key={idx} className="mb-4">
        {msg.user && (
          <div className="flex justify-end mb-2">
            <div className="bg-blue-100 rounded-lg py-2 px-4 max-w-[80%]">
              <p className="text-sm">{msg.user}</p>
            </div>
          </div>
        )}
        {msg.bot && (
          <div className="flex justify-start mb-2">
            <div className="bg-gray-100 rounded-lg py-2 px-4 max-w-[80%]">
              <p className="text-sm whitespace-pre-wrap">{msg.bot}</p>
            </div>
          </div>
        )}
      </div>
    ))}
    <div ref={messagesEndRef} />
    {loading && (
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )}
  </div>

  <div className="p-4 border-t">
    <div className="flex gap-2">
      <textarea
        value={chatInput}
        onChange={(e) => setChatInput(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
          }
        }}
        className="flex-1 p-2 border rounded resize-none"
        placeholder="Type a message..."
        rows="2"
        disabled={!selectedAgent || loading}
      />
      <button
        onClick={handleSendMessage}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
        disabled={!selectedAgent || !chatInput.trim() || loading}
      >
        {loading ? 'Sending...' : 'Send'}
      </button>
    </div>
  </div>
</div>

      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-4">Create New Chat</h3>
            <input
              type="text"
              value={newChatName}
              onChange={(e) => setNewChatName(e.target.value)}
              placeholder="Enter chat name"
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNewChatModal(false)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewChat}
                className="px-4 py-2 bg-blue-500 text-white rounded"
                disabled={!newChatName.trim()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}