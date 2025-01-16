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
import { Button } from '../ui/button';
import { Select, SelectItem } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Card } from '../ui/card';
import FormChat from './FormChat';

const TEMPLATE_NAME = "Marketing Success Wheel";

const SuccessWheel = ({ onComplete, currentUser }) => {
  const [template, setTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [shared, setShared] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formId] = useState(() => `sw_${Date.now()}`);

  useEffect(() => {
    const fetchTemplateAndAnswers = async () => {
      try {
        // Fetch template
        const templateQuery = query(
          collection(db, 'resources'),
          where('templateName', '==', TEMPLATE_NAME)
        );
        const templateSnapshot = await getDocs(templateQuery);

        if (!templateSnapshot.empty) {
          const templateData = templateSnapshot.docs[0].data();
          setTemplate(templateData);

          // Fetch previous answers if user exists
          if (currentUser?.uid) {
            const answersQuery = query(
              collection(db, 'resourcesData'),
              where('templateName', '==', TEMPLATE_NAME),
              where('userId', '==', currentUser.authenticationID),
              orderBy('timestamp', 'desc')
            );
            const answersSnapshot = await getDocs(answersQuery);

            if (!answersSnapshot.empty) {
              const lastSubmission = answersSnapshot.docs[0].data();
              setFormData(lastSubmission.answers || {});
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
  }, [currentUser?.uid]);

  const handleInputChange = (question, value) => {
    setFormData(prev => ({
      ...prev,
      [question]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!template || !currentUser?.uid) return;

    const allQuestionsAnswered = template.sections.every(
      section => formData[section.question]?.trim()
    );

    if (!allQuestionsAnswered) {
      alert('Please answer all questions before submitting.');
      return;
    }

    try {
      const formattedResponses = template.sections.map(section => ({
        question: section.question,
        answer: formData[section.question],
        definition: section.definition,
        evaluationCriteria: section.evaluationCriteria,
      }));

      await addDoc(collection(db, 'resourcesData'), {
        templateName: TEMPLATE_NAME,
        userId: currentUser.uid,
        teamId: currentUser.teamId || '',
        shared,
        answers: formattedResponses,
        timestamp: serverTimestamp(),
      });

      alert('Your responses have been saved successfully!');
      setFormData({});
      onComplete();
    } catch (error) {
      console.error('Error saving responses:', error);
      alert('An error occurred while saving your responses. Please try again.');
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

  const formContent = (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">{template.templateName}</h1>
        <p className="text-gray-600 mb-6">{template.description}</p>

        {lastUpdated && (
          <p className="text-sm text-gray-500 mb-4">
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </p>
        )}

        <form className="space-y-6">
          {template.sections.map((section, index) => (
            <div key={index} className="p-4 border rounded-lg bg-gray-50">
              <h2 className="text-lg font-semibold mb-2">{section.question}</h2>
              <p className="text-sm text-gray-600 mb-2">{section.definition}</p>
              <p className="text-sm text-gray-500 italic mb-4">
                {section.evaluationCriteria}
              </p>

              <Select
                value={formData[section.question] || ''}
                onValueChange={(value) => handleInputChange(section.question, value)}
              >
                <SelectItem value="">Select a grade</SelectItem>
                {section.gradingScale?.map((grade, idx) => (
                  <SelectItem key={idx} value={grade}>
                    {grade}
                  </SelectItem>
                ))}
              </Select>
            </div>
          ))}

          <div className="flex items-center space-x-2 my-4">
            <Checkbox
              id="shared"
              checked={shared}
              onCheckedChange={(checked) => setShared(checked)}
            />
            <label htmlFor="shared" className="text-sm text-gray-600">
              Share responses with my team
            </label>
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Save Responses
          </Button>
        </form>
      </Card>
    </div>
  );

  return (
    <FormChat
      formName={TEMPLATE_NAME}
      formId={formId}
      projectId={currentUser?.teamId}
      projectName={template?.templateName}
      currentUser={currentUser}
    >
      {formContent}
    </FormChat>
  );
};

export default SuccessWheel;