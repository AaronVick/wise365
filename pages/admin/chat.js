// pages/admin/chat.js

import { useState, useEffect, useRef } from 'react';

export default function Chat() {
  const [agents, setAgents] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedLLM, setSelectedLLM] = useState('chatGPT'); // Default to ChatGPT
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const messagesEndRef = useRef(null);

  const llmOptions = ['chatGPT', 'Anthropic'];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    async function fetchInitialData() {
      setLoading(true);
      setError(null);
      try {
        const agentsRes = await fetch('/api/admin?tab=agents');
        if (!agentsRes.ok) throw new Error('Failed to fetch agents');
        const agentsData = await agentsRes.json();
        setAgents(agentsData || []);

        const conversationsRes = await fetch('/api/admin?tab=conversations');
        if (!conversationsRes.ok) throw new Error('Failed to fetch conversations');
        const conversationsData = await conversationsRes.json();
        setConversations(
          conversationsData.map((conv) => ({
            id: conv.id,
            name: conv.chatName || 'Default Chat',
            messages: [],
          }))
        );
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setError('Failed to load initial data');
      } finally {
        setLoading(false);
      }
    }
    fetchInitialData();
  }, []);

  const handleAgentSelection = async (agentId) => {
    setSelectedAgent(agentId);
    setSelectedConversation(null);
    setChatMessages([]);
    setLoading(true);
    try {
      const messagesRes = await fetch(`/api/admin/messages?agentId=${agentId}`);
      if (!messagesRes.ok) throw new Error('Failed to fetch messages');
      const messagesData = await messagesRes.json();

      const groupedConversations = messagesData.reduce((acc, msg) => {
        const name = msg.chatName || 'Default Chat';
        if (!acc[name]) acc[name] = [];
        acc[name].push(msg);
        return acc;
      }, {});

      const conversationList = Object.entries(groupedConversations).map(
        ([name, messages]) => ({
          name,
          messages: messages.map((msg) => ({
            content: msg.conversation,
            from: msg.from,
          })),
        })
      );

      setConversations(conversationList);
      const defaultConversation = conversationList.find((c) => c.name === 'Default Chat');
      if (defaultConversation) {
        handleConversationSelection(defaultConversation);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError(error.message || 'Failed to load agent data');
    } finally {
      setLoading(false);
    }
  };

  const handleConversationSelection = (conversation) => {
    setSelectedConversation(conversation);
    setChatMessages(
      conversation.messages.map((msg) => ({
        user: msg.from === 'admin' ? msg.content : null,
        bot: msg.from !== 'admin' ? msg.content : null,
      }))
    );
  };

  const handleSendMessage = async () => {
    if (!selectedAgent || !chatInput.trim()) {
      alert('Please select an agent and enter a message.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const agentRes = await fetch(`/api/admin?tab=agents&agentId=${selectedAgent}`);
      if (!agentRes.ok) throw new Error('Failed to fetch agent data');
      const agentData = await agentRes.json();

      const llmKey = selectedLLM === 'chatGPT' ? 'openAI' : 'Anthropic';
      const promptData = agentData.prompt?.[llmKey];
      if (!promptData?.description) {
        throw new Error(`No prompt found for agent ${selectedAgent} and LLM ${selectedLLM}`);
      }

      const systemPrompt = promptData.description;

      const res = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent,
          message: chatInput,
          prompt: systemPrompt,
          conversationId: selectedConversation?.id || null,
          llm: selectedLLM,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const { reply } = await res.json();
      if (!reply) {
        throw new Error('No reply received from server');
      }

      setChatMessages((prev) => [...prev, { user: chatInput, bot: reply }]);
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
      <h2 className="text-2xl font-bold mb-4">Chat with Agents</h2>
      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <select
          className="p-2 border rounded"
          value={selectedAgent || ''}
          onChange={(e) => handleAgentSelection(e.target.value)}
        >
          <option value="" disabled>Select an Agent</option>
          {agents.map((agent) => (
            <option key={agent.agentId} value={agent.agentId}>
              {agent.agentName}
            </option>
          ))}
        </select>

        <select
          className="p-2 border rounded"
          value={selectedConversation?.name || ''}
          onChange={(e) => {
            const conv = conversations.find((c) => c.name === e.target.value);
            if (conv) handleConversationSelection(conv);
          }}
        >
          <option value="">Default Chat</option>
          {conversations.map((conv) => (
            <option key={conv.name} value={conv.name}>
              {conv.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white shadow rounded p-6">
        {chatMessages.map((msg, idx) => (
          <div key={idx} className={`mb-4 ${msg.user ? 'text-right' : 'text-left'}`}>
            {msg.user && <div className="bg-blue-100 p-2 rounded inline-block">{msg.user}</div>}
            {msg.bot && <div className="bg-gray-100 p-2 rounded inline-block">{msg.bot}</div>}
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>

      <div className="mt-4 flex gap-2">
        <textarea
          className="flex-1 p-2 border rounded"
          rows="3"
          placeholder="Type your message..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
        />
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={handleSendMessage}
          disabled={!chatInput.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
