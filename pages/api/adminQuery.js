// pages/api/adminQuery.js

import { collection, doc, getDocs, updateDoc, query, limit, startAfter } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST requests only." });
  }

  const { codeSnippet } = req.body;

  if (!codeSnippet) {
    return res.status(400).json({ error: "Code snippet is required in the request body." });
  }

  try {
    // Step 1: Validate the code snippet using the LLM
    const validationResponse = await validateWithLLM(codeSnippet);

    if (!validationResponse.valid) {
      return res.status(400).json({
        error: "Code snippet validation failed.",
        details: validationResponse.feedback,
      });
    }

    // Step 2: Dynamically execute the code snippet
    let result;
    try {
      const executeSnippet = new Function(
        "db", "collection", "doc", "getDocs", "updateDoc", "query", "limit", "startAfter",
        codeSnippet
      );
      result = await executeSnippet(db, collection, doc, getDocs, updateDoc, query, limit, startAfter);
    } catch (executionError) {
      throw new Error(`Error executing code snippet: ${executionError.message}`);
    }

    return res.status(200).json({ message: "Code snippet executed successfully.", result });
  } catch (error) {
    console.error("Error in adminQuery:", error);
    return res.status(500).json({ error: error.message || "Internal server error." });
  }
}

// Function to validate the code snippet using an LLM
async function validateWithLLM(codeSnippet) {
  try {
    const prompt = `
  You are validating JavaScript code snippets for securely performing Firebase operations. 
  These snippets are executed within a pre-configured API environment that already provides:
  - An initialized Firebase Firestore instance (\`db\`).
  - Imported Firestore utilities: \`collection\`, \`getDocs\`, \`updateDoc\`, \`doc\`, \`query\`, \`limit\`, \`startAfter\`.
  - The environment ensures secure and proper connections to the Firestore database.

  The code snippet does not need to include:
  - Firebase initialization or imports.
  - Any direct database connection logic.

  Your job is to validate the following:
  - Proper use of Firestore utilities.
  - Logical correctness of the operations (e.g., batching, pagination, updates).
  - Syntax correctness.
  - That the snippet can perform the described task without external dependencies beyond the provided utilities.

An example of as snippet we may use to do things like update reocrds would look like this:
async function updateAgentDataRecords(db, collection, getDocs, updateDoc, doc, query, limit, startAfter) {
  const BATCH_SIZE = 10;

  try {
    const agentsSnapshot = await getDocs(collection(db, "agents"));
    const agentsMap = {};
    agentsSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      agentsMap[data.agentId] = data.agentName;
    });
    console.log("Agents Mapping:", agentsMap);

    let lastDoc = null;
    let hasMoreRecords = true;

    while (hasMoreRecords) {
      const agentDataQuery = query(
        collection(db, "agentData"),
        ...(lastDoc ? [startAfter(lastDoc)] : []),
        limit(BATCH_SIZE)
      );

      const agentDataSnapshot = await getDocs(agentDataQuery);

      if (agentDataSnapshot.empty) {
        hasMoreRecords = false;
        break;
      }

      const updatePromises = agentDataSnapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        if (agentsMap[data.agentId]) {
          await updateDoc(doc(db, "agentData", docSnap.id), { agentId: agentsMap[data.agentId] });
        }
      });

      await Promise.all(updatePromises);
      lastDoc = agentDataSnapshot.docs[agentDataSnapshot.docs.length - 1];
    }

    return "Agent data updated successfully.";
  } catch (error) {
    console.error("Error updating agent data:", error);
    throw new Error("Failed to update agent data records.");
  }
}

  Return:
  - \`valid\`: true/false
  - A short explanation if invalid
  - Suggested corrections if possible

  Code Snippet:
  \`\`\`
  ${codeSnippet}
  \`\`\`
`;



    const payload = {
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful assistant for validating JavaScript code snippets." },
        { role: "user", content: prompt },
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
    const content = data.choices[0].message.content;

    if (content.toLowerCase().includes("valid: true")) {
      return { valid: true, feedback: null };
    } else {
      return { valid: false, feedback: content };
    }
  } catch (error) {
    console.error("LLM validation error:", error);
    return { valid: false, feedback: "An error occurred during validation." };
  }
}
