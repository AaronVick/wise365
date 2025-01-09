// components/ChatInterface.js

const ChatInterface = ({ chatId, agentId, userId, isDefault, title }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // Fetch messages for the selected conversation
  useEffect(() => {
    if (!chatId) return;

    const messagesRef = collection(db, 'conversations');
    const q = query(
      messagesRef,
      where('agentId', '==', agentId),
      where('chatId', '==', chatId),  // Use chatId to group messages
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(chatMessages);

      // Auto-scroll to the bottom
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    });

    return () => unsubscribe();
  }, [chatId, agentId]);

  // Send a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);

    try {
      // Get the parent chat document to get conversation details
      const chatDoc = await getDoc(doc(db, 'conversations', chatId));
      if (!chatDoc.exists()) throw new Error('Chat not found');
      const chatData = chatDoc.data();

      // Log the user's message in Firebase
      const messagesRef = collection(db, 'conversations');
      await addDoc(messagesRef, {
        agentId,
        chatId: chatId,
        content: newMessage,
        from: userId,
        timestamp: serverTimestamp(),
        type: 'user',
        conversationName: chatData.conversationName, // Inherit from parent chat
        isDefault: isDefault
      });

      setNewMessage('');

      // Get agent information including prompt
      const agent = agents.find(a => a.id === agentId);
      const systemPrompt = `You are ${agent.name}, ${agent.role}. ${
        isDefault ? 'This is a new conversation.' : `This is a conversation about ${chatData.conversationName}.`
      } Respond accordingly.`;

      // Send to LLM API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: newMessage }
          ]
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to send message');

      // Log the agent's response
      await addDoc(messagesRef, {
        agentId,
        chatId: chatId,
        content: result.reply,
        from: agentId,
        timestamp: serverTimestamp(),
        type: 'agent',
        conversationName: chatData.conversationName, // Inherit from parent chat
        isDefault: isDefault
      });
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Add chat title */}
      <div className="border-b p-4 bg-white">
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        {/* Rest of the component remains the same */}
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.from === userId ? 'justify-end' : 'justify-start'
              }`}
            >
              <div 
                className={`p-3 rounded-lg max-w-[70%] ${
                  message.from === userId 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p>{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="border-t p-4">
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
            disabled={loading}
          />
          <Button type="submit" disabled={loading}>
            {loading ? (
              'Sending...'
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};