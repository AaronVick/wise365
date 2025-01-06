export default function AgentCard({ agent, onEdit }) {
  return (
    <div className="p-4 bg-gray-100 shadow rounded">
      <h3 className="text-lg font-semibold">{agent.agentName}</h3>
      <p className="text-sm text-gray-600">Role: {agent.Role}</p>
      <p className="text-sm text-gray-600">Personality: {agent.personality}</p>
      <p className="text-sm text-gray-600">Tasks: {agent.tasks.join(', ')}</p>
      <button
        onClick={() => onEdit(agent)}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Edit
      </button>
    </div>
  );
}
