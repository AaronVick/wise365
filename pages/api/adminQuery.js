// pages/api/adminQuery.js

import { collection, doc, setDoc, updateDoc, deleteDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST requests only." });
  }

  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Query is required in the request body." });
  }

  try {
    // Parse the query
    let parsedQuery;
    try {
      parsedQuery = JSON.parse(query);
    } catch (err) {
      throw new Error("Query must be valid JSON.");
    }

    // Validate the query using the LLM
    const validationResponse = await validateWithLLM(parsedQuery);
    if (!validationResponse.valid) {
      return res.status(400).json({
        error: "Validation failed.",
        details: validationResponse.feedback,
      });
    }

    const { action, collectionName, documentId, data, extra } = parsedQuery;

    switch (action) {
      case "add":
        if (!collectionName || !data) {
          throw new Error("Collection name and data are required for adding a document.");
        }
        await setDoc(doc(collection(db, collectionName)), data);
        return res.status(200).json({ message: `Document added successfully to ${collectionName}.` });

      case "update":
        if (!collectionName || !documentId || !data) {
          throw new Error("Collection name, document ID, and data are required for updating a document.");
        }
        await updateDoc(doc(collection(db, collectionName), documentId), data);
        return res.status(200).json({ message: `Document ${documentId} in ${collectionName} updated successfully.` });

      case "delete":
        if (!collectionName || !documentId) {
          throw new Error("Collection name and document ID are required for deleting a document.");
        }
        await deleteDoc(doc(collection(db, collectionName), documentId));
        return res.status(200).json({ message: `Document ${documentId} deleted successfully from ${collectionName}.` });

      case "complex":
        if (!extra || !extra.operation) {
          throw new Error("Complex operations require an 'extra' field with an 'operation' property.");
        }
        const result = await handleComplexOperation(extra.operation, extra.params || {});
        return res.status(200).json(result);

      default:
        throw new Error("Invalid action. Supported actions are: add, update, delete, complex.");
    }
  } catch (error) {
    console.error("Error executing query:", error);
    return res.status(500).json({ error: error.message || "Internal server error." });
  }
}

// Function to validate the query using LLM
async function validateWithLLM(query) {
  try {
    const requirements = `
      You are validating queries for a Firebase admin API. The API supports the following actions:
      - add: Requires "collectionName" and "data" fields.
      - update: Requires "collectionName", "documentId", and "data" fields.
      - delete: Requires "collectionName" and "documentId" fields.
      - complex: Requires an "extra" field with an "operation" property. This can include operations like relinking agent IDs, bulk updates, or other custom tasks.

      Here are examples of valid queries:
      1. { "action": "add", "collectionName": "users", "data": { "name": "John Doe", "email": "john@example.com" } }
      2. { "action": "update", "collectionName": "users", "documentId": "user123", "data": { "email": "newemail@example.com" } }
      3. { "action": "delete", "collectionName": "users", "documentId": "user123" }
      4. { "action": "complex", "extra": { "operation": "relink-agent-ids", "params": { "teamId": "team123" } } }

      Validate the following query:
      ${JSON.stringify(query)}
      
      Return:
      - "valid": true/false
      - A short explanation if invalid
      - Suggested corrections if possible
    `;

    const payload = {
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful assistant for validating and correcting Firebase admin queries." },
        { role: "user", content: requirements },
      ],
      max_tokens: 800,
      temperature: 0.5,
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`LLM validation failed: ${response.statusText}`);
    }

    const data = await response.json();
    const messageContent = data.choices[0].message.content;

    if (messageContent.toLowerCase().includes("valid: true")) {
      return { valid: true, feedback: null };
    } else {
      return { valid: false, feedback: messageContent };
    }
  } catch (error) {
    console.error("LLM validation error:", error);
    return { valid: false, feedback: "An error occurred during validation." };
  }
}

// Example: Handle dynamic complex operations
async function handleComplexOperation(operation, params) {
  switch (operation) {
    case "relink-agent-ids":
      return await relinkAgentIds(params);
    case "update-user-status":
      return await updateUserStatus(params);
    case "bulk-update-data":
      return await bulkUpdateData(params);
    default:
      throw new Error(`Unsupported complex operation: ${operation}`);
  }
}
