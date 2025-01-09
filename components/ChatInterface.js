const ChatInterface = ({ chatId, agentId, userId, isDefault, title }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationNameData, setConversationNameData] = useState(null);
  const scrollRef = useRef(null);

  // First fetch the conversationName data
  useEffect(() => {
    const fetchConversationData = async () => {
      if (!chatId) return;

      try {
        const chatDoc = await getDoc(doc(db, 'conversations', chatId));
        if (!chatDoc.exists()) return;
        
        const conversationNameId = chatDoc.data().conversationName;
        if (conversationNameId) {
          const nameDoc = await getDoc(doc(db, 'conversationNames', conversationNameId));
          if (nameDoc.exists()) {
            setConversationNameData(nameDoc.data());
          }
        }
      } catch (error) {
        console.error('Error fetching conversation data:', error);
      }
    };

    fetchConversationData();
  }, [chatId]);

  // Fetch messages for the selected conversation
  useEffect(() => {
    if (!chatId) return;

    const messagesRef = collection(db, 'conversations');
    const q = query(
      messagesRef,
      where('chatId', '==', chatId),  // Group messages by parent chat ID
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(chatMessages);

      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    });

    return () => unsubscribe();
  }, [chatId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);

    try {
      // Get the parent chat document
      const chatDoc = await getDoc(doc(db, 'conversations', chatId));
      if (!chatDoc.exists()) throw new Error('Chat not found');
      const chatData = chatDoc.data();

      // Get the conversation name details
      const conversationNameId = chatData.conversationName;
      let conversationDisplayName = title;
      if (conversationNameId) {
        const nameDoc = await getDoc(doc(db, 'conversationNames', conversationNameId));
        if (nameDoc.exists()) {
          conversationDisplayName = nameDoc.data().conversationName;
        }
      }

      // Log the user's message
      const messagesRef = collection(db, 'conversations');
      await addDoc(messagesRef, {
        agentId,
        chatId: chatId,
        content: newMessage,
        from: userId,
        timestamp: serverTimestamp(),
        type: 'user',
        conversationName: conversationNameId, // Use the reference ID
        isDefault: isDefault
      });

      setNewMessage('');

      // Get agent information and construct prompt
      const agent = agents.find(a => a.id === agentId);
      const systemPrompt = `You are ${agent.name}, ${agent.role}. ${
        isDefault ? 'This is a new conversation.' : `This is a conversation named "${conversationDisplayName}".`
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
        conversationName: conversationNameId, // Use the reference ID
        isDefault: isDefault
      });
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  // Rest of the component remains the same...
  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 bg-white">
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      
      {/* Rest of the JSX remains the same */}
    </div>
  );
};