import { useEffect, useState } from 'react';

export default function ManageAgents() {
  const [data, setData] = useState([]);
  const [editingAgent, setEditingAgent] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAgent, setNewAgent] = useState({
    agentId: '',
    agentName: '',
    Role: '',
    RoleInfo: '',
    Type: '',
    language: 'English',
    personality: '',
    tasks: '',
    About: '',
  });

  // Fetch agents on mount
  useEffect(() => {
    async function fetchAgents() {
      const res = await fetch('/api/admin?tab=agents');
      const result = await res.json();
      setData(result || []);
    }
    fetchAgents();
  }, []);

  // Handle adding a new agent
  const handleAddAgent = async () => {
    const formattedTasks = newAgent.tasks.split(',').map((task) => task.trim());
    const agentPayload = { ...newAgent, tasks: formattedTasks };

    const res = await fetch('/api/admin/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agentPayload),
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
        tasks: '',
        About: '',
      });
      setShowAddForm(false);
      const updatedData = await fetch('/api/admin?tab=agents').then((res) => res.json());
      setData(updatedData);
    } else {
      alert('Failed to add agent.');
    }
  };

  // Handle editing an agent
  const handleEditAgent = async () => {
    if (!editingAgent) return;

    const formattedTasks = editingAgent.tasks.split(',').map((task) => task.trim());
    const agentPayload = { ...editingAgent, tasks: formattedTasks };

    const res = await fetch(`/api/admin/agents/${editingAgent.agentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agentPayload),
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

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Manage Agents</h2>
      
      {/* Agents Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((agent) => (
          <div
            key={agent.agentId}
            className="p-4 bg-gray-200 shadow rounded"
            style={{ backgroundColor: '#f3f4f6' }}
          >
            <h3 className="text-md font-bold mb-2">{agent.agentName}</h3>
            <p className="text-sm mb-1"><strong>Agent ID:</strong> {agent.agentId}</p>
            <p className="text-sm mb-1"><strong>Role:</strong> {agent.Role}</p>
            <p className="text-sm mb-1"><strong>Role Info:</strong> {agent.RoleInfo}</p>
            <p className="text-sm mb-1"><strong>Type:</strong> {agent.Type}</p>
            <p className="text-sm mb-1"><strong>Language:</strong> {agent.language}</p>
            <p className="text-sm mb-1"><strong>Personality:</strong> {agent.personality}</p>
            <button
              onClick={() => setEditingAgent(agent)}
              className="px-3 py-1 mt-3 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            >
              Edit
            </button>
          </div>
        ))}
      </div>

      {/* Add New Agent Section */}
      {!editingAgent && !showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-green-500 text-white rounded mt-6 hover:bg-green-600"
        >
          Add New Agent
        </button>
      )}

      {showAddForm && (
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
          <textarea
            placeholder="About (Description)"
            value={newAgent.About}
            onChange={(e) => setNewAgent({ ...newAgent, About: e.target.value })}
            className="p-2 border rounded w-full mb-2"
          />
          <textarea
            placeholder="Tasks (comma-separated)"
            value={newAgent.tasks}
            onChange={(e) => setNewAgent({ ...newAgent, tasks: e.target.value })}
            className="p-2 border rounded w-full mb-2"
          />
          <button
            onClick={handleAddAgent}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Add Agent
          </button>
        </div>
      )}

      {/* Edit Agent Section */}
      {editingAgent && (
        <div className="p-4 bg-white shadow rounded mt-6">
          <h3 className="text-lg font-semibold mb-4">Edit Agent: {editingAgent.agentName}</h3>
          <input
            type="text"
            placeholder="Agent Name"
            value={editingAgent.agentName}
            onChange={(e) =>
              setEditingAgent({ ...editingAgent, agentName: e.target.value })
            }
            className="p-2 border rounded w-full mb-2"
          />
          <textarea
            placeholder="Tasks (comma-separated)"
            value={editingAgent.tasks}
            onChange={(e) =>
              setEditingAgent({ ...editingAgent, tasks: e.target.value })
            }
            className="p-2 border rounded w-full mb-2"
          />
          <button
            onClick={handleEditAgent}
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
    </div>
  );
}
