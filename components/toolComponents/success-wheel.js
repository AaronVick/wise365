// components/toolComponents/success-wheel.js


import React, { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Select, SelectItem } from '../ui/select';
import Checkbox from '../ui/checkbox';
import { Card } from '../ui/card';

const SuccessWheel = ({ onComplete }) => {
  const { currentUser } = useAuth() || {};
  const [template, setTemplate] = useState(null);
  const [responses, setResponses] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [shared, setShared] = useState(false);
  const [loading, setLoading] = useState(true);
  const templateName = 'Marketing Success Wheel';

  // Fetch template and previous answers
  useEffect(() => {
    const fetchTemplateAndAnswers = async () => {
      try {
        // Fetch template from Firestore
        const templateQuery = query(
          collection(db, 'resources'),
          where('templateName', '==', templateName)
        );
        const templateSnapshot = await getDocs(templateQuery);

        if (!templateSnapshot.empty) {
          const templateData = templateSnapshot.docs[0].data();
          setTemplate(templateData);

          // Fetch previous answers
          if (currentUser) {
            const answersQuery = query(
              collection(db, 'resourcesData'),
              where('templateName', '==', templateName),
              where('userId', '==', currentUser.uid),
              orderBy('timestamp', 'desc')
            );
            const answersSnapshot = await getDocs(answersQuery);

            if (!answersSnapshot.empty) {
              const lastSubmission = answersSnapshot.docs[0].data();
              setResponses(lastSubmission.answers || {});
              setLastUpdated(lastSubmission.timestamp?.toDate());
            }
          }
        } else {
          console.warn('Template not found in Firestore');
        }
      } catch (error) {
        console.error('Error fetching template or prior responses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplateAndAnswers();
  }, [currentUser]);

  const handleChange = (question, answer) => {
    setResponses((prev) => ({
      ...prev,
      [question]: answer,
    }));
  };

  const handleSubmit = async () => {
    if (!template || !currentUser) return;

    const allQuestionsAnswered = template.sections.every(
      (section) => responses[section.question]?.trim()
    );

    if (!allQuestionsAnswered) {
      alert('Please answer all questions before submitting.');
      return;
    }

    try {
      const formattedResponses = template.sections.map((section) => ({
        question: section.question,
        answer: responses[section.question],
        definition: section.definition,
        evaluationCriteria: section.evaluationCriteria,
      }));

      await addDoc(collection(db, 'resourcesData'), {
        templateName: template.templateName,
        userId: currentUser.uid,
        teamId: currentUser.teamId || '',
        shared,
        answers: formattedResponses,
        timestamp: serverTimestamp(),
      });

      alert('Your responses have been saved successfully!');
      setResponses({}); // Clear the form
      onComplete(); // Return to main dashboard
    } catch (error) {
      console.error('Error saving responses:', error);
      alert('An error occurred while saving your responses. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading form...</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>The required template was not found. Please contact support.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">{template.templateName}</h1>
        <p className="text-gray-600 mb-6">{template.description}</p>

        {lastUpdated ? (
          <p className="mb-6 text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleDateString()}{' '}
            {lastUpdated.toLocaleTimeString()}
          </p>
        ) : (
          <p className="mb-6 text-sm text-gray-500">
            This is your first time completing this form.
          </p>
        )}

        <form className="space-y-6">
          {template.sections.map((section, index) => (
            <div key={index} className="mb-6">
              <h2 className="text-lg font-semibold mb-2">{section.question}</h2>
              <p className="text-sm text-gray-500 mb-2">{section.definition}</p>
              <p className="text-sm text-gray-500 mb-4">{section.evaluationCriteria}</p>

              <Select
                value={responses[section.question] || ''}
                onValueChange={(value) => handleChange(section.question, value)}
              >
                <SelectItem value="">Select a grade</SelectItem>
                {section.gradingScale.map((grade, idx) => (
                  <SelectItem key={idx} value={grade}>
                    {grade}
                  </SelectItem>
                ))}
              </Select>
            </div>
          ))}

          <div className="flex items-center mb-6">
            <Checkbox
              id="shared"
              checked={shared}
              onCheckedChange={(checked) => setShared(checked)}
              label="Share responses with my team"
            />
          </div>

          <Button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2"
          >
            Save Responses
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default SuccessWheel;
