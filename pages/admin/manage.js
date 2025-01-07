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
    tasks: '',
    About: '',
  });
  const [editingAgent, setEditingAgent] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    async function fetchAgents() {
      const res = await fetch('/api/admin?tab=agents');
      const result = await res.json();
      setData(result || []);
    }
    fetchAgents();
  }, []);

  const handleAddAgent = async () => {
    const formattedTasks = newAgent.tasks
      ? newAgent.tasks.split(',').map((task) => task.trim())
      : [];

    const agentPayload = { ...newAgent, tasks: formattedTasks };

    try {
      const res = await fetch('/api/admin/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentPayload),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(`Failed to add agent: ${error.message || 'Unknown error'}`);
        return;
      }

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
    } catch (error) {
      console.error('Error adding agent:', error);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  const handleEditAgent = async () => {
    if (!editingAgent) return;

    const formattedTasks = editingAgent.tasks
      ? editingAgent.tasks.split(',').map((task) => task.trim())
      : [];

    const agentPayload = { ...editingAgent, tasks: formattedTasks };

    try {
      const res = await fetch(`/api/admin/agents/${editingAgent.agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentPayload),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(`Failed to update agent: ${error.message || 'Unknown error'}`);
        return;
      }

      alert('Agent updated successfully!');
      setEditingAgent(null);

      const updatedData = await fetch('/api/admin?tab=agents').then((res) => res.json());
      setData(updatedData);
    } catch (error) {
      console.error('Error updating agent:', error);
      alert('An unexpected error occurred. Please try again.');
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
            <p className="text-sm mb-1">
              <strong>Agent ID:</strong> {agent.agentId}
            </p>
            <p className="text-sm mb-1">
              <strong>Role:</strong> {agent.Role}
            </p>
            <p className="text-sm mb-1">
              <strong>Role Info:</strong> {agent.RoleInfo}
            </p>
            <p className="text-sm mb-1">
              <strong>Type:</strong> {agent.Type}
            </p>
            <p className="text-sm mb-1">
              <strong>Language:</strong> {agent.language}
            </p>
            <p className="text-sm mb-1">
              <strong>Personality:</strong> {agent.personality}
            </p>
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
            placeholder="Agent ID (e.g., 'aaron')"
            value={newAgent.agentId}
            onChange={(e) => setNewAgent({ ...newAgent, agentId: e.target.value })}
            className="p-2 border rounded w-full mb-2"
          />
          <input
            type="text"
            placeholder="Agent Name (e.g., 'Aaron')"
            value={newAgent.agentName}
            onChange={(e) => setNewAgent({ ...newAgent, agentName: e.target.value })}
            className="p-2 border rounded w-full mb-2"
          />
          <textarea
            placeholder="About (e.g., 'Describe the agent’s purpose and value')"
            value={newAgent.About}
            onChange={(e) => setNewAgent({ ...newAgent, About: e.target.value })}
            className="p-2 border rounded w-full mb-2"
          />
          <textarea
            placeholder="Tasks (comma-separated, e.g., 'task1, task2')"
            value={newAgent.tasks}
            onChange={(e) => setNewAgent({ ...newAgent, tasks: e.target.value })}
            className="p-2 border rounded w-full mb-2"
          />
          <input
            type="text"
            placeholder="Role (e.g., 'Marketing Strategist')"
            value={newAgent.Role}
            onChange={(e) => setNewAgent({ ...newAgent, Role: e.target.value })}
            className="p-2 border rounded w-full mb-2"
          />
          <textarea
            placeholder="Role Info (e.g., 'Guides users in ...')"
            value={newAgent.RoleInfo}
            onChange={(e) => setNewAgent({ ...newAgent, RoleInfo: e.target.value })}
            className="p-2 border rounded w-full mb-2"
          />
          <input
            type="text"
            placeholder="Type (e.g., 'Marketing')"
            value={newAgent.Type}
            onChange={(e) => setNewAgent({ ...newAgent, Type: e.target.value })}
            className="p-2 border rounded w-full mb-2"
          />
          <input
            type="text"
            placeholder="Personality (e.g., 'Warm and encouraging')"
            value={newAgent.personality}
            onChange={(e) => setNewAgent({ ...newAgent, personality: e.target.value })}
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

    {/* Base Fields */}
    <div className="grid grid-cols-1 gap-4 mb-4">
      <div>
        <label className="block text-sm font-medium mb-1">Agent ID</label>
        <input
          type="text"
          value={editingAgent.agentId}
          onChange={(e) =>
            setEditingAgent({ ...editingAgent, agentId: e.target.value })
          }
          className="p-2 border rounded w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Agent Name</label>
        <input
          type="text"
          value={editingAgent.agentName}
          onChange={(e) =>
            setEditingAgent({ ...editingAgent, agentName: e.target.value })
          }
          className="p-2 border rounded w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">About</label>
        <textarea
          value={editingAgent.About}
          onChange={(e) =>
            setEditingAgent({ ...editingAgent, About: e.target.value })
          }
          className="p-2 border rounded w-full h-32"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Role</label>
        <input
          type="text"
          value={editingAgent.Role}
          onChange={(e) =>
            setEditingAgent({ ...editingAgent, Role: e.target.value })
          }
          className="p-2 border rounded w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Role Info</label>
        <textarea
          value={editingAgent.RoleInfo}
          onChange={(e) =>
            setEditingAgent({ ...editingAgent, RoleInfo: e.target.value })
          }
          className="p-2 border rounded w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Type</label>
        <input
          type="text"
          value={editingAgent.Type}
          onChange={(e) =>
            setEditingAgent({ ...editingAgent, Type: e.target.value })
          }
          className="p-2 border rounded w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Language</label>
        <input
          type="text"
          value={editingAgent.language}
          onChange={(e) =>
            setEditingAgent({ ...editingAgent, language: e.target.value })
          }
          className="p-2 border rounded w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Personality</label>
        <textarea
          value={editingAgent.personality}
          onChange={(e) =>
            setEditingAgent({ ...editingAgent, personality: e.target.value })
          }
          className="p-2 border rounded w-full"
        />
      </div>

      {/* FAQs Section */}
      {editingAgent.faqs && (
        <div>
          <label className="block text-sm font-medium mb-1">FAQs</label>
          {editingAgent.faqs.map((faq, idx) => (
            <div key={idx} className="mb-4 p-4 border rounded">
              <input
                type="text"
                placeholder="Question"
                value={faq.question}
                onChange={(e) => {
                  const newFaqs = [...editingAgent.faqs];
                  newFaqs[idx] = { ...newFaqs[idx], question: e.target.value };
                  setEditingAgent({ ...editingAgent, faqs: newFaqs });
                }}
                className="p-2 border rounded w-full mb-2"
              />
              <textarea
                placeholder="Answer"
                value={faq.answer}
                onChange={(e) => {
                  const newFaqs = [...editingAgent.faqs];
                  newFaqs[idx] = { ...newFaqs[idx], answer: e.target.value };
                  setEditingAgent({ ...editingAgent, faqs: newFaqs });
                }}
                className="p-2 border rounded w-full"
              />
              <button
                onClick={() => {
                  const newFaqs = [...editingAgent.faqs];
                  newFaqs.splice(idx, 1);
                  setEditingAgent({ ...editingAgent, faqs: newFaqs });
                }}
                className="mt-2 px-2 py-1 bg-red-500 text-white rounded"
              >
                Remove FAQ
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              const newFaqs = [...(editingAgent.faqs || []), { question: '', answer: '' }];
              setEditingAgent({ ...editingAgent, faqs: newFaqs });
            }}
            className="px-2 py-1 bg-blue-500 text-white rounded"
          >
            Add FAQ
          </button>
        </div>
      )}

      {/* Examples Section */}
      {editingAgent.examples && (
        <div>
          <label className="block text-sm font-medium mb-1">Examples</label>
          {editingAgent.examples.map((example, idx) => (
            <div key={idx} className="mb-4 p-4 border rounded">
              <input
                type="text"
                placeholder="Template ID"
                value={example.templateId}
                onChange={(e) => {
                  const newExamples = [...editingAgent.examples];
                  newExamples[idx] = { ...newExamples[idx], templateId: e.target.value };
                  setEditingAgent({ ...editingAgent, examples: newExamples });
                }}
                className="p-2 border rounded w-full mb-2"
              />
              <input
                type="text"
                placeholder="Category"
                value={example.category}
                onChange={(e) => {
                  const newExamples = [...editingAgent.examples];
                  newExamples[idx] = { ...newExamples[idx], category: e.target.value };
                  setEditingAgent({ ...editingAgent, examples: newExamples });
                }}
                className="p-2 border rounded w-full mb-2"
              />
              <textarea
                placeholder="Statement"
                value={example.statement}
                onChange={(e) => {
                  const newExamples = [...editingAgent.examples];
                  newExamples[idx] = { ...newExamples[idx], statement: e.target.value };
                  setEditingAgent({ ...editingAgent, examples: newExamples });
                }}
                className="p-2 border rounded w-full"
              />
              <button
                onClick={() => {
                  const newExamples = [...editingAgent.examples];
                  newExamples.splice(idx, 1);
                  setEditingAgent({ ...editingAgent, examples: newExamples });
                }}
                className="mt-2 px-2 py-1 bg-red-500 text-white rounded"
              >
                Remove Example
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              const newExamples = [...(editingAgent.examples || []), { templateId: '', category: '', statement: '' }];
              setEditingAgent({ ...editingAgent, examples: newExamples });
            }}
            className="px-2 py-1 bg-blue-500 text-white rounded"
          >
            Add Example
          </button>
        </div>
      )}

      {/* Tasks Section */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Tasks</label>
        {Array.isArray(editingAgent.tasks) ? (
          editingAgent.tasks.map((task, idx) => (
            <div key={idx} className="flex mb-2">
              <input
                type="text"
                value={task}
                onChange={(e) => {
                  const newTasks = [...editingAgent.tasks];
                  newTasks[idx] = e.target.value;
                  setEditingAgent({ ...editingAgent, tasks: newTasks });
                }}
                className="p-2 border rounded flex-1 mr-2"
              />
              <button
                onClick={() => {
                  const newTasks = [...editingAgent.tasks];
                  newTasks.splice(idx, 1);
                  setEditingAgent({ ...editingAgent, tasks: newTasks });
                }}
                className="px-2 py-1 bg-red-500 text-white rounded"
              >
                Remove
              </button>
            </div>
          ))
        ) : (
          <textarea
            placeholder="Tasks (comma-separated)"
            value={editingAgent.tasks}
            onChange={(e) =>
              setEditingAgent({ ...editingAgent, tasks: e.target.value })
            }
            className="p-2 border rounded w-full mb-2"
          />
        )}
        {Array.isArray(editingAgent.tasks) && (
          <button
            type="button"
            onClick={() => setEditingAgent({
              ...editingAgent,
              tasks: [...editingAgent.tasks, '']
            })}
            className="px-2 py-1 bg-gray-200 rounded mt-2"
          >
            + Add Task
          </button>
        )}
      </div>
    </div>

    {/* Action Buttons */}
    <div className="flex gap-2">
      <button
        onClick={handleEditAgent}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
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
  </div>
)}
  </div> 
  );
}