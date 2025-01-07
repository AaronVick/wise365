import { useEffect, useState } from 'react';

export default function ManageAgents() {
  const [data, setData] = useState([]);
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
  const [editingAgent, setEditingAgent] = useState(null);

  useEffect(() => {
    async function fetchAgents() {
      const res = await fetch('/api/admin?tab=agents');
      const result = await res.json();
      setData(result || []);
    }
    fetchAgents();
  }, []);

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

  const handleEditAgent = async () => {
    if (!editingAgent) return;

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

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Manage Agents</h2>
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
            {data.map((agent) => (
              <tr key={agent.agentId} className="bg-white">
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
          <input
            type="text"
            placeholder="Role"
            value={editingAgent.Role}
            onChange={(e) =>
              setEditingAgent({ ...editingAgent, Role: e.target.value })
            }
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
