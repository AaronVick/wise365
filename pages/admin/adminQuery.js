// pages/admin/adminQuery.js

import { useState } from "react";

export default function AdminQueryPage() {
  const [codeSnippet, setCodeSnippet] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleQuerySubmit = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch("/api/adminQuery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codeSnippet }),
      });

      const data = await res.json();

      if (res.ok) {
        setResponse(data);
      } else {
        setError(data.error || "An error occurred.");
      }
    } catch (err) {
      setError("An error occurred while executing the query.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Admin Query Page</h2>
      <textarea
        className="w-full p-4 border rounded mb-4"
        rows="10"
        value={codeSnippet}
        onChange={(e) => setCodeSnippet(e.target.value)}
        placeholder="Enter your code snippet here"
      />
      <button
        onClick={handleQuerySubmit}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        disabled={!codeSnippet || loading}
      >
        {loading ? "Executing..." : "Execute Query"}
      </button>
      {error && <div className="text-red-500 mt-4">{error}</div>}
      {response && (
        <div className="mt-4">
          <h3 className="font-bold">Response:</h3>
          <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
