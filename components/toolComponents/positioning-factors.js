// components/toolComponents/positioning-factors.js

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
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectItem } from '../ui/select';
import { Card } from '../ui/card';
import FormChat from './FormChat';

const TEMPLATE_NAME = "Positioning Factor Worksheet";

const PositioningFactors = ({ onComplete }) => {
  const auth = useAuth();
  const currentUser = auth?.currentUser;

  const [template, setTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [shared, setShared] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formId] = useState(() => `pf_${Date.now()}`);

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
              where('userId', '==', currentUser.uid),
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
      await addDoc(collection(db, 'resourcesData'), {
        userId: currentUser.uid,
        teamId: currentUser.teamId || '',
        templateName: TEMPLATE_NAME,
        answers: formData,
        shared,
        timestamp: serverTimestamp(),
      });

      alert('Form submitted successfully!');
      setFormData({});
      onComplete();
    } catch (error) {
      console.error('Error saving form data:', error);
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

  const renderField = (section) => {
    const { question, options } = section;

    if (options) {
      return (
        <Select
          value={formData[question] || ''}
          onValueChange={(value) => handleInputChange(question, value)}
        >
          <SelectItem value="">Select an option</SelectItem>
          {options.map((option, idx) => (
            <SelectItem key={idx} value={option}>
              {option}
            </SelectItem>
          ))}
        </Select>
      );
    }

    // Use textarea for longer responses
    return (
      <Textarea
        value={formData[question] || ''}
        onChange={(e) => handleInputChange(question, e.target.value)}
        placeholder="Your answer"
        rows={4}
      />
    );
  };

  const formContent = (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">{template.templateName}</h1>
        <p className="text-sm text-gray-500 mb-6">{template.description}</p>

        {lastUpdated && (
          <p className="text-sm text-gray-500 mb-4">
            Last updated on: {new Date(lastUpdated).toLocaleString()}
          </p>
        )}

        <form className="space-y-6">
          {template.sections.map((section, index) => (
            <div key={index} className="space-y-2">
              <label className="block text-sm font-medium">
                {section.question}
              </label>
              {section.definition && (
                <p className="text-sm text-gray-500 mb-2">{section.definition}</p>
              )}
              {section.evaluationCriteria && (
                <p className="text-sm text-gray-400 italic mb-2">
                  {section.evaluationCriteria}
                </p>
              )}
              {renderField(section)}
            </div>
          ))}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={shared}
              onChange={(e) => setShared(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label className="text-sm">Share with my team</label>
          </div>

          <Button
            type="button"
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Save
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
    >
      {formContent}
    </FormChat>
  );
};

export default PositioningFactors;