// components/toolComponents/positioning-factors.js

import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import Checkbox from "../ui/checkbox";
import Textarea from "../ui/textarea";
import { Input } from "../ui/input";
import { Select, SelectItem } from "../ui/select";

const PositioningFactors = ({ onComplete }) => {
  const { currentUser } = useAuth() || {};
  const [template, setTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [shared, setShared] = useState(false);
  const [loading, setLoading] = useState(true);

  const templateName = "Positioning Factor Worksheet";

  // Fetch template and previous answers
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const q = query(
          collection(db, "resources"),
          where("templateName", "==", templateName)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const templateData = querySnapshot.docs[0].data();
          setTemplate(templateData);
        } else {
          console.warn("Template not found in Firestore");
        }
      } catch (error) {
        console.error("Error fetching template:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchPreviousAnswers = async () => {
      if (!currentUser || !currentUser.uid) return;

      try {
        const q = query(
          collection(db, "resourcesData"),
          where("userId", "==", currentUser.uid),
          where("templateName", "==", templateName),
          orderBy("timestamp", "desc")
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const lastAnswer = querySnapshot.docs[0].data();
          setFormData(lastAnswer.answers || {});
          setLastUpdated(lastAnswer.timestamp?.toDate());
        }
      } catch (error) {
        console.error("Error fetching previous answers:", error);
      }
    };

    fetchTemplate();
    fetchPreviousAnswers();
  }, [currentUser]);

  const handleInputChange = (question, value) => {
    setFormData((prev) => ({
      ...prev,
      [question]: value || "",
    }));
  };

  const handleSubmit = async () => {
    if (!template || !currentUser) return;

    const allQuestionsAnswered = template.sections.every((section) =>
      section.subQuestions
        ? section.subQuestions.every(
            (subQ) => formData[subQ.question]?.trim()
          )
        : formData[section.question]?.trim()
    );

    if (!allQuestionsAnswered) {
      alert("Please answer all questions before saving.");
      return;
    }

    try {
      await addDoc(collection(db, "resourcesData"), {
        userId: currentUser.uid,
        teamId: currentUser.teamId || "",
        templateName,
        answers: formData,
        shared,
        timestamp: serverTimestamp(),
      });

      alert("Form submitted successfully!");
      setFormData({}); // Clear the form
      onComplete(); // Return to main dashboard
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("An error occurred while submitting the form. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading form...</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>The required template was not found. Please contact support.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">{template.templateName}</h2>
        <p className="text-gray-600 mb-6">
          {lastUpdated
            ? `Last updated on: ${new Date(lastUpdated).toLocaleString()}`
            : "Please complete the form below to define your positioning factors."}
        </p>

        <form className="space-y-6">
          {template.sections.map((section, index) => (
            <div key={index} className="space-y-2">
              <h3 className="font-medium">{section.question}</h3>
              {section.definition && (
                <p className="text-sm text-gray-500">{section.definition}</p>
              )}

              {section.subQuestions
                ? section.subQuestions.map((subQ, subIndex) => (
                    <div key={subIndex} className="mb-4">
                      <label className="block font-medium text-sm">
                        {subQ.question}
                      </label>
                      <Input
                        value={formData[subQ.question] || ""}
                        onChange={(e) =>
                          handleInputChange(subQ.question, e.target.value)
                        }
                      />
                    </div>
                  ))
                : section.options ? (
                    <Select
                      value={formData[section.question] || ""}
                      onValueChange={(value) =>
                        handleInputChange(section.question, value)
                      }
                    >
                      <SelectItem value="">Select an option</SelectItem>
                      {section.options.map((option, optIndex) => (
                        <SelectItem key={optIndex} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </Select>
                  ) : (
                    <Textarea
                      value={formData[section.question] || ""}
                      onChange={(e) =>
                        handleInputChange(section.question, e.target.value)
                      }
                      placeholder="Your answer"
                    />
                  )}
            </div>
          ))}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="shared"
              checked={shared}
              onChange={(e) => setShared(e.target.checked)}
              label="Share this form with my team"
            />
          </div>

          <Button
            type="button"
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Submit
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default PositioningFactors;
