//pages/PositiongFactors.js

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { useAuth } from "../contexts/AuthContext";

const PositioningFactors = () => {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({});
  const [shared, setShared] = useState(false);
  const [previousAnswers, setPreviousAnswers] = useState(null);
  const [loading, setLoading] = useState(true);

  const templateName = "Positioning Factor Worksheet";

  useEffect(() => {
    const fetchPreviousAnswers = async () => {
      if (!currentUser) {
        setLoading(false); // Stop loading if no user is logged in
        return;
      }

      try {
        const q = query(
          collection(db, "resourcesData"),
          where("userId", "==", currentUser.uid),
          where("templateName", "==", templateName)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const latestDoc = querySnapshot.docs[0].data();
          setPreviousAnswers(latestDoc);
          setFormData(latestDoc.answers || {});
        }
      } catch (error) {
        console.error("Error fetching previous answers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreviousAnswers();
  }, [currentUser]);

  const handleInputChange = (question, value) => {
    setFormData((prev) => ({
      ...prev,
      [question]: value,
    }));
  };

  const handleSubmit = async () => {
    const allQuestionsAnswered = Object.values(formData).every(
      (val) => val && val.trim() !== ""
    );

    if (!allQuestionsAnswered) {
      alert("Please answer all questions before submitting.");
      return;
    }

    if (!currentUser) {
      alert("User must be logged in to submit the form.");
      return;
    }

    try {
      await addDoc(collection(db, "resourcesData"), {
        userId: currentUser.uid,
        teamId: currentUser.teamId || null,
        shared,
        templateName,
        answers: formData,
        timestamp: serverTimestamp(),
      });

      alert("Form submitted successfully!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("An error occurred while submitting the form. Please try again.");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">{templateName}</h2>
        <p className="text-gray-600 mb-6">
          {previousAnswers
            ? `You last submitted this form on ${
                previousAnswers?.timestamp?.seconds
                  ? new Date(
                      previousAnswers.timestamp.seconds * 1000
                    ).toLocaleDateString()
                  : "No prior submission date available."
              }. You can update your answers below.`
            : "Please complete the form below to define your positioning factors."}
        </p>

        <div className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Website URL</label>
            <input
              type="url"
              value={formData["Website URL"] || ""}
              onChange={(e) => handleInputChange("Website URL", e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {[
            "Step 1: Reflect on Your Strengths",
            "Step 2: Identify Unique Attributes",
            "Step 3: Highlight Recognitions and Achievements",
            "Step 4: Focus on Guarantees and Warranties",
            "Step 5: Define Your Market and Industry Focus",
            "Step 6: Highlight Customer Success Stories",
          ].map((section, index) => (
            <div key={index}>
              <h3 className="font-medium mb-2">{section}</h3>
              {[1, 2, 3].map((i) => (
                <div key={i} className="mb-3">
                  <label className="block text-sm font-medium mb-1">
                    {section} {i}
                  </label>
                  <input
                    type="text"
                    value={formData[`${section} ${i}`] || ""}
                    onChange={(e) =>
                      handleInputChange(`${section} ${i}`, e.target.value)
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              ))}
            </div>
          ))}

          <div>
            <label className="block font-medium mb-1">
              Which of Maslow's Needs must be met for the persona to realize
              you are their T.I.N.B?
            </label>
            <select
              value={formData["Maslow's Needs"] || ""}
              onChange={(e) =>
                handleInputChange("Maslow's Needs", e.target.value)
              }
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select an option</option>
              {[
                "Physiological",
                "Safety",
                "Love & Belonging",
                "Esteem",
                "Self-Actualization",
              ].map((need, index) => (
                <option key={index} value={need}>
                  {need}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center mt-4">
            <Checkbox
              id="shared"
              checked={shared}
              onCheckedChange={(checked) => setShared(checked)}
              label="Share this form with my team"
            />
          </div>

          <Button
            onClick={handleSubmit}
            className="mt-6 w-full bg-blue-600 text-white"
          >
            Submit
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PositioningFactors;