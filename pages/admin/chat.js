//  pages/admin/chat.js

const handleSendMessage = async () => {
  if (!selectedAgent || !chatInput.trim()) {
    alert('Please select an agent and enter a message.');
    return;
  }

  setLoading(true);
  setError(null);

  try {
    // Construct prompt using agent persona
    const prompt = agentPersona
      ? `You are ${selectedAgent}. ${agentPersona.description}\n\nUser: ${chatInput}\nAgent:`
      : `You are ${selectedAgent}. Please respond to: ${chatInput}`;

    console.log('Sending message with:', { agentId: selectedAgent, message: chatInput, prompt });

    const res = await fetch('/api/admin/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId: selectedAgent,
        message: chatInput,
        prompt
      }),
    });

    console.log('Response status:', res.status);
    const responseText = await res.text(); // Get raw response text
    console.log('Raw response:', responseText);

    if (!res.ok) {
      try {
        const errorData = JSON.parse(responseText);
        throw new Error(errorData.error || 'Failed to send message');
      } catch (parseError) {
        throw new Error(`Server error: ${responseText || res.statusText}`);
      }
    }

    try {
      const data = JSON.parse(responseText);
      if (!data.reply) {
        throw new Error('No reply received from server');
      }

      setChatMessages(prev => [...prev, { user: chatInput, bot: data.reply }]);
      setChatInput('');
    } catch (parseError) {
      throw new Error('Invalid response format from server');
    }
  } catch (error) {
    console.error('Error sending message:', error);
    setError('Failed to send message: ' + error.message);
  } finally {
    setLoading(false);
  }
};