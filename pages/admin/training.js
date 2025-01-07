//  /pages/admin/training.js

import { useEffect, useState } from 'react';

export default function Training() {
  const [data, setData] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Define initial states for different data types
  const dataTypeTemplates = {
    instructions: {
      agentId: '',
      dataType: 'instructions',
      description: '',
      URL: '',
      milestone: false,
      data: {
        context: {
          purpose: '',
          approach: []
        },
        responseFormat: {
          categories: [],
          finalStatement: ''
        }
      }
    },
    personality: {
      agentId: '',
      dataType: 'personality',
      description: '',
      URL: '',
      milestone: false,
      data: {
        examples: '',
        tone: '',
        traits: [],
        JSON: ''
      }
    },
    milestone: {
      agentId: '',
      dataType: 'milestone',
      description: '',
      URL: '',
      milestone: true,
      order: 1,
      question: '',
      guidance: '',
      feedbackExample: '',
      data: {
        qa: {
          question: '',
          guidance: '',
          feedbackExample: ''
        }
      }
    },
    knowledge_base: {
      agentId: '',
      dataType: 'knowledge_base',
      description: '',
      URL: '',
      milestone: false,
      data: {
        content: '',
        categories: [],
        references: [],
        examples: []
      }
    },
    feedback_bank: {
      agentId: '',
      dataType: 'feedback_bank',
      description: '',
      URL: '',
      milestone: false,
      data: {
        scenarios: [],
        responses: [],
        guidelines: ''
      }
    }
  };

  const [newKnowledge, setNewKnowledge] = useState(dataTypeTemplates.knowledge_base);

  const dataTypeOptions = [
    { value: 'instructions', label: 'Instructions' },
    { value: 'personality', label: 'Personality' },
    { value: 'milestone', label: 'Milestone' },
    { value: 'knowledge_base', label: 'Knowledge Base' },
    { value: 'feedback_bank', label: 'Feedback Bank' }
  ];

  // Handler for data type change
  const handleDataTypeChange = (e) => {
    const selectedType = e.target.value;
    setNewKnowledge({
      ...dataTypeTemplates[selectedType],
      agentId: selectedAgent
    });
  };

  // Handler for array fields
  const handleArrayField = (field, index, value, parentField = null) => {
    setNewKnowledge(prev => {
      const newData = { ...prev };
      if (parentField) {
        newData.data[parentField][field][index] = value;
      } else {
        newData.data[field][index] = value;
      }
      return newData;
    });
  };

  // Handler to add array item
  const handleAddArrayItem = (field, parentField = null) => {
    setNewKnowledge(prev => {
      const newData = { ...prev };
      if (parentField) {
        newData.data[parentField][field] = [...(newData.data[parentField][field] || []), ''];
      } else {
        newData.data[field] = [...(newData.data[field] || []), ''];
      }
      return newData;
    });
  };

  // Render form fields based on data type
  const renderDataTypeFields = () => {
    switch (newKnowledge.dataType) {
      case 'instructions':
        return (
          <>
            <textarea
              className="p-2 border rounded w-full mb-2"
              placeholder="Purpose"
              value={newKnowledge.data.context.purpose}
              onChange={(e) => setNewKnowledge({
                ...newKnowledge,
                data: {
                  ...newKnowledge.data,
                  context: { ...newKnowledge.data.context, purpose: e.target.value }
                }
              })}
            />
            <div className="mb-2">
              <label className="block font-bold mb-1">Approach Steps</label>
              {newKnowledge.data.context.approach.map((step, idx) => (
                <div key={idx} className="flex mb-2">
                  <input
                    type="text"
                    className="p-2 border rounded flex-1 mr-2"
                    value={step}
                    onChange={(e) => handleArrayField('approach', idx, e.target.value, 'context')}
                  />
                </div>
              ))}
              <button
                type="button"
                className="px-2 py-1 bg-gray-200 rounded"
                onClick={() => handleAddArrayItem('approach', 'context')}
              >
                + Add Step
              </button>
            </div>
            <div className="mb-2">
              <label className="block font-bold mb-1">Response Categories</label>
              {newKnowledge.data.responseFormat.categories.map((category, idx) => (
                <div key={idx} className="flex mb-2">
                  <input
                    type="text"
                    className="p-2 border rounded flex-1 mr-2"
                    value={category}
                    onChange={(e) => handleArrayField('categories', idx, e.target.value, 'responseFormat')}
                  />
                </div>
              ))}
              <button
                type="button"
                className="px-2 py-1 bg-gray-200 rounded"
                onClick={() => handleAddArrayItem('categories', 'responseFormat')}
              >
                + Add Category
              </button>
            </div>
            <textarea
              className="p-2 border rounded w-full mb-2"
              placeholder="Final Statement"
              value={newKnowledge.data.responseFormat.finalStatement}
              onChange={(e) => setNewKnowledge({
                ...newKnowledge,
                data: {
                  ...newKnowledge.data,
                  responseFormat: { ...newKnowledge.data.responseFormat, finalStatement: e.target.value }
                }
              })}
            />
          </>
        );

      case 'personality':
        return (
          <>
            <textarea
              className="p-2 border rounded w-full mb-2"
              placeholder="Examples"
              value={newKnowledge.data.examples}
              onChange={(e) => setNewKnowledge({
                ...newKnowledge,
                data: { ...newKnowledge.data, examples: e.target.value }
              })}
            />
            <textarea
              className="p-2 border rounded w-full mb-2"
              placeholder="Tone"
              value={newKnowledge.data.tone}
              onChange={(e) => setNewKnowledge({
                ...newKnowledge.data,
                data: { ...newKnowledge.data, tone: e.target.value }
              })}
            />
            <div className="mb-2">
              <label className="block font-bold mb-1">Traits</label>
              {newKnowledge.data.traits.map((trait, idx) => (
                <div key={idx} className="flex mb-2">
                  <input
                    type="text"
                    className="p-2 border rounded flex-1 mr-2"
                    value={trait}
                    onChange={(e) => handleArrayField('traits', idx, e.target.value)}
                  />
                </div>
              ))}
              <button
                type="button"
                className="px-2 py-1 bg-gray-200 rounded"
                onClick={() => handleAddArrayItem('traits')}
              >
                + Add Trait
              </button>
            </div>
          </>
        );

      case 'milestone':
        return (
          <>
            <input
              type="number"
              className="p-2 border rounded w-full mb-2"
              placeholder="Order"
              value={newKnowledge.order}
              onChange={(e) => setNewKnowledge({
                ...newKnowledge,
                order: Number(e.target.value)
              })}
            />
            <textarea
              className="p-2 border rounded w-full mb-2"
              placeholder="Question"
              value={newKnowledge.data.qa.question}
              onChange={(e) => setNewKnowledge({
                ...newKnowledge,
                data: {
                  ...newKnowledge.data,
                  qa: { ...newKnowledge.data.qa, question: e.target.value }
                }
              })}
            />
            <textarea
              className="p-2 border rounded w-full mb-2"
              placeholder="Guidance"
              value={newKnowledge.data.qa.guidance}
              onChange={(e) => setNewKnowledge({
                ...newKnowledge,
                data: {
                  ...newKnowledge.data,
                  qa: { ...newKnowledge.data.qa, guidance: e.target.value }
                }
              })}
            />
            <textarea
              className="p-2 border rounded w-full mb-2"
              placeholder="Feedback Example"
              value={newKnowledge.data.qa.feedbackExample}
              onChange={(e) => setNewKnowledge({
                ...newKnowledge,
                data: {
                  ...newKnowledge.data,
                  qa: { ...newKnowledge.data.qa, feedbackExample: e.target.value }
                }
              })}
            />
          </>
        );

      // Add other cases for knowledge_base and feedback_bank
      default:
        return null;
    }
  };

  // Fetch agents on mount
  useEffect(() => {
    async function fetchAgents() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/admin?tab=agents');
        if (!res.ok) throw new Error('Failed to fetch agents');
        const agentsData = await res.json();
        console.log('Fetched agents:', agentsData);
        setAgents(agentsData || []);
      } catch (error) {
        console.error('Error fetching agents:', error);
        setError(error.message);
        setAgents([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAgents();
  }, []);

  // Fetch training data for selected agent
  const handleAgentSelection = async (agentId) => {
    console.log('Selected agent:', agentId);
    setSelectedAgent(agentId);
    setNewKnowledge({ ...newKnowledge, agentId });
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin?tab=training&agentId=${agentId}`);
      console.log('Training data response status:', res.status);
      
      if (!res.ok) throw new Error('Failed to fetch training data');
      
      const trainingData = await res.json();
      console.log('Received training data:', trainingData);
      
      setData(trainingData || []);
    } catch (error) {
      console.error('Error fetching training data:', error);
      setError(error.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };



  // Add new knowledge for the selected agent
  const handleAddKnowledge = async () => {
    if (!selectedAgent) {
      alert('Please select an agent before adding knowledge.');
      return;
    }

    setLoading(true);
    setError(null);

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
      setError(error.message);
      alert('Failed to add knowledge. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Training Data</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      )}

      <select
        className="p-2 border rounded w-full mb-4"
        value={selectedAgent || ''}
        onChange={(e) => handleAgentSelection(e.target.value)}
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

     {/* Display Existing Training Data */}
{data.length > 0 ? (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {data.map((item, idx) => (
      <div key={idx} className="p-4 bg-gray-100 shadow rounded">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold">{item.dataType}</h3>
          <button
            onClick={() => setEditingItem(item)}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            Edit
          </button>
        </div>
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
        
        {/* Display additional data based on type */}
        {item.data && (
          <div className="mt-2 text-sm">
            {item.data.examples && (
              <p><strong>Examples:</strong> {item.data.examples}</p>
            )}
            {item.data.tone && (
              <p><strong>Tone:</strong> {item.data.tone}</p>
            )}
            {item.data.traits && item.data.traits.length > 0 && (
              <p><strong>Traits:</strong> {item.data.traits.join(', ')}</p>
            )}
            {item.data.context?.purpose && (
              <p><strong>Purpose:</strong> {item.data.context.purpose}</p>
            )}
          </div>
        )}
      </div>
    ))}
  </div>
) : (
  <p className="text-gray-600">
    {selectedAgent 
      ? 'No training data available.' 
      : 'Select an agent to view training data.'}
  </p>
)}

{/* Edit Training Item Modal */}
{editingItem && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <h3 className="text-lg font-bold mb-4">Edit {editingItem.dataType}</h3>
      
      <textarea
        className="p-2 border rounded w-full mb-2"
        placeholder="Description"
        value={editingItem.description}
        onChange={(e) => setEditingItem({
          ...editingItem,
          description: e.target.value
        })}
      />

      <input
        type="text"
        className="p-2 border rounded w-full mb-2"
        placeholder="URL (Optional)"
        value={editingItem.URL || ''}
        onChange={(e) => setEditingItem({
          ...editingItem,
          URL: e.target.value
        })}
      />

      <div className="mb-2">
        <label className="mr-2 font-bold">Milestone:</label>
        <input
          type="checkbox"
          checked={editingItem.milestone || false}
          onChange={(e) => setEditingItem({
            ...editingItem,
            milestone: e.target.checked
          })}
        />
      </div>

      {editingItem.order !== undefined && (
        <input
          type="number"
          className="p-2 border rounded w-full mb-2"
          placeholder="Order"
          value={editingItem.order}
          onChange={(e) => setEditingItem({
            ...editingItem,
            order: Number(e.target.value)
          })}
        />
      )}

      {/* Data type specific fields */}
      {editingItem.dataType === 'personality' && (
        <>
          <textarea
            className="p-2 border rounded w-full mb-2"
            placeholder="Examples"
            value={editingItem.data?.examples || ''}
            onChange={(e) => setEditingItem({
              ...editingItem,
              data: { ...editingItem.data, examples: e.target.value }
            })}
          />
          <textarea
            className="p-2 border rounded w-full mb-2"
            placeholder="Tone"
            value={editingItem.data?.tone || ''}
            onChange={(e) => setEditingItem({
              ...editingItem,
              data: { ...editingItem.data, tone: e.target.value }
            })}
          />
          <div className="mb-2">
            <label className="block font-bold mb-1">Traits</label>
            {(editingItem.data?.traits || []).map((trait, idx) => (
              <div key={idx} className="flex mb-2">
                <input
                  type="text"
                  className="p-2 border rounded flex-1 mr-2"
                  value={trait}
                  onChange={(e) => {
                    const newTraits = [...(editingItem.data?.traits || [])];
                    newTraits[idx] = e.target.value;
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, traits: newTraits }
                    });
                  }}
                />
                <button
                  onClick={() => {
                    const newTraits = [...(editingItem.data?.traits || [])];
                    newTraits.splice(idx, 1);
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, traits: newTraits }
                    });
                  }}
                  className="px-2 py-1 bg-red-500 text-white rounded"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setEditingItem({
                ...editingItem,
                data: {
                  ...editingItem.data,
                  traits: [...(editingItem.data?.traits || []), '']
                }
              })}
              className="px-2 py-1 bg-gray-200 rounded"
            >
              + Add Trait
            </button>
          </div>
        </>
      )}

      {/* Add similar sections for other data types */}

      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={() => setEditingItem(null)}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          onClick={handleUpdateKnowledge}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Save Changes
        </button>
      </div>
    </div>
  </div>
)}

      {/* Add New Knowledge Form */}
      {selectedAgent && !loading && (
        <div className="p-4 bg-white shadow rounded mt-6">
          <h3 className="text-lg font-bold mb-2">Add New Knowledge</h3>
          <select
            className="p-2 border rounded w-full mb-2"
            value={newKnowledge.dataType}
            onChange={handleDataTypeChange}
          >
            {dataTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <textarea
            className="p-2 border rounded w-full mb-2"
            placeholder="Description"
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

          {/* Dynamic fields based on data type */}
          {renderDataTypeFields()}

          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
            onClick={handleAddKnowledge}
            disabled={loading}
          >
            Add Knowledge
          </button>
        </div>
      )}
    </div>
  );
}

  


