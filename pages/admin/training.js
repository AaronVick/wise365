import { useEffect, useState } from 'react';

export default function Training() {
  const [data, setData] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [newKnowledge, setNewKnowledge] = useState({
    agentId: '',
    dataType: 'knowledge_base',
    description: '',
    URL: '',
    milestone: false,
    order: 1,
    data: {
      introduction: { greeting: '' },
      context: { purpose: '' },
      process: [],
      qa: [{ question: '', guidance: '', feedbackExample: '' }],
      responseFormat: { categories: [], finalStatement: '' },
      additionalNotes: [],
    },
  });

  const dataTypeOptions = [
    'knowledge_base',
    'personality',
    'milestones',
    'feedbackBank',
    'faqs',
  ];

  // Fetch agents on mount
  useEffect(() => {
    async function fetchAgents() {
      try {
        const res = await fetch('/api/admin?tab=agents');
        if (!res.ok) throw new Error('Failed to fetch agents');
        const agentsData = await res.json();
        setAgents(agentsData || []);
      } catch (error) {
        console.error('Error fetching agents:', error);
        setAgents([]);
      }
    }
    fetchAgents();
  }, []);

  // Fetch training data for selected agent
  const handleAgentSelection = async (agentId) => {
    setSelectedAgent(agentId);
    setNewKnowledge({ ...newKnowledge, agentId });

    try {
      const res = await fetch(`/api/admin?tab=training&agentId=${agentId}`);
      if (!res.ok) throw new Error('Failed to fetch training data');
      const trainingData = await res.json();

      // Filter the data on the client side to ensure it matches the selected agentId
      const filteredData = trainingData.filter((item) => item.agentId === agentId);
      setData(filteredData || []);
    } catch (error) {
      console.error('Error fetching training data:', error);
      setData([]);
    }
  };

  // Add new knowledge for the selected agent
  const handleAddKnowledge = async () => {
    if (!selectedAgent) {
      alert('Please select an agent before adding knowledge.');
      return;
    }

    try {
      const res = await fetch('/api/admin/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKnowledge),
      });

      if (!res.ok) throw new Error('Failed to add knowledge');

      alert('Knowledge added successfully!');
      setNewKnowledge({
        agentId: selectedAgent,
        dataType: 'knowledge_base',
        description: '',
        URL: '',
        milestone: false,
        order: 1,
        data: {
          introduction: { greeting: '' },
          context: { purpose: '' },
          process: [],
          qa: [{ question: '', guidance: '', feedbackExample: '' }],
          responseFormat: { categories: [], finalStatement: '' },
          additionalNotes: [],
        },
      });

      handleAgentSelection(selectedAgent); // Refresh training data
    } catch (error) {
      console.error('Error adding knowledge:', error);
      alert('Failed to add knowledge. Please try again.');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Training Data</h2>
      <select
        className="p-2 border rounded w-full mb-4"
        value={selectedAgent || ''}
        onChange={(e) => handleAgentSelection(e.target.value)}
      >
        <option value="" disabled>
          {agents.length === 0 ? 'No agents available' : 'Select an Agent'}
        </option>
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.agentName}: {agent.Role}
          </option>
        ))}
      </select>

      {/* Display Existing Training Data */}
      {data.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((item, idx) => (
            <div key={idx} className="p-4 bg-gray-100 shadow rounded">
              <h3 className="font-bold">{item.dataType}</h3>
              <p>{item.description}</p>
              {item.URL && (
                <a
                  href={item.URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500"
                >
                  Learn More
                </a>
              )}
              {item.milestone && <p className="text-green-600 font-semibold">Milestone</p>}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">
          {selectedAgent ? 'No training data available.' : 'Select an agent to view training data.'}
        </p>
      )}

      {/* Add New Knowledge Form */}
      {selectedAgent && (
        <div className="p-4 bg-white shadow rounded mt-6">
          <h3 className="text-lg font-bold mb-2">Add New Knowledge</h3>
          <select
            className="p-2 border rounded w-full mb-2"
            value={newKnowledge.dataType}
            onChange={(e) => setNewKnowledge({ ...newKnowledge, dataType: e.target.value })}
          >
            {dataTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <textarea
            className="p-2 border rounded w-full mb-2"
            placeholder="Description of the knowledge"
            value={newKnowledge.description}
            onChange={(e) => setNewKnowledge({ ...newKnowledge, description: e.target.value })}
          />
          <input
            type="text"
            className="p-2 border rounded w-full mb-2"
            placeholder="URL (Optional)"
            value={newKnowledge.URL}
            onChange={(e) => setNewKnowledge({ ...newKnowledge, URL: e.target.value })}
          />
          <div className="mb-2">
            <label className="mr-2 font-bold">Milestone:</label>
            <input
              type="checkbox"
              checked={newKnowledge.milestone}
              onChange={(e) => setNewKnowledge({ ...newKnowledge, milestone: e.target.checked })}
            />
          </div>
          <input
            type="number"
            className="p-2 border rounded w-full mb-2"
            placeholder="Order (e.g., 1)"
            value={newKnowledge.order}
            onChange={(e) => setNewKnowledge({ ...newKnowledge, order: Number(e.target.value) })}
          />
          <textarea
            className="p-2 border rounded w-full mb-2"
            placeholder="Introduction Greeting"
            value={newKnowledge.data.introduction.greeting}
            onChange={(e) =>
              setNewKnowledge({
                ...newKnowledge,
                data: { ...newKnowledge.data, introduction: { greeting: e.target.value } },
              })
            }
          />
          <textarea
            className="p-2 border rounded w-full mb-2"
            placeholder="Purpose Context"
            value={newKnowledge.data.context.purpose}
            onChange={(e) =>
              setNewKnowledge({
                ...newKnowledge,
                data: { ...newKnowledge.data, context: { purpose: e.target.value } },
              })
            }
          />
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={handleAddKnowledge}
          >
            Add Knowledge
          </button>
        </div>
      )}
    </div>
  );
}
