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
      Validate the following JavaScript code snippet for securely performing Firebase operations. Check for:
      - Proper use of Firebase Firestore APIs (collection, doc, getDocs, updateDoc, etc.).
      - Syntax correctness.
      - Logical completeness of the operations.

      Return:
      - "valid": true/false
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
