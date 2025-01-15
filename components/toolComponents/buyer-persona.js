// components/toolComponents/buyer-persona.js

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

const TEMPLATE_NAME = "Worlds Best Buyer Persona"; // Match exactly what's in Firebase

const BuyerPersona = ({ onComplete }) => {
  const auth = useAuth();
  const currentUser = auth?.currentUser;

  const [template, setTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [shared, setShared] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formId] = useState(() => `bp_${Date.now()}`);

  // Fetch the template and previous answers
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const q = query(
          collection(db, 'resources'),
          where('templateName', '==', TEMPLATE_NAME)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const templateData = querySnapshot.docs[0].data();
          setTemplate(templateData);
        } else {
          console.warn('Template not found in Firestore');
        }
      } catch (error) {
        console.error('Error fetching template:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchPreviousAnswers = async () => {
      if (!currentUser?.uid) return;

      try {
        const q = query(
          collection(db, 'resourcesData'),
          where('userId', '==', currentUser.uid),
          where('templateName', '==', TEMPLATE_NAME),
          orderBy('timestamp', 'desc')
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const lastAnswer = querySnapshot.docs[0].data();
          setFormData(lastAnswer.answers || {});
          setLastUpdated(lastAnswer.timestamp?.toDate());
        }
      } catch (error) {
        console.error('Error fetching previous answers:', error);
      }
    };

    fetchTemplate();
    if (currentUser) {
      fetchPreviousAnswers();
    }
  }, [currentUser]);

  const handleInputChange = (question, value) => {
    setFormData((prev) => ({
      ...prev,
      [question]: value,
    }));
  };

  const validateInput = (section, value) => {
    if (!value?.trim()) return false;

    // Add specific validation based on question type
    if (section.question.toLowerCase().includes('url')) {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    }

    // Age validation
    if (section.question.includes('old is your persona')) {
      const age = parseInt(value);
      return !isNaN(age) && age > 0 && age < 120;
    }

    // Income validation
    if (section.question.includes('annual income')) {
      const income = parseFloat(value.replace(/[^0-9.]/g, ''));
      return !isNaN(income) && income >= 0;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!template || !currentUser) return;

    // Validate all answers
    const invalidQuestions = template.sections
      .filter(section => !validateInput(section, formData[section.question]))
      .map(section => section.question);

    if (invalidQuestions.length > 0) {
      alert(`Please provide valid answers for:\n${invalidQuestions.join('\n')}`);
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

      alert('Form saved successfully!');
      setFormData({});
      onComplete();
    } catch (error) {
      console.error('Error saving form data:', error);
      alert('Error saving form data. Please try again.');
    }
  };

  if (!auth || !currentUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Please sign in to access this form.</p>
      </div>
    );
  }

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
    const { question, options, definition } = section;

    // For Maslow's Hierarchy questions or other select options
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

    // For URL input
    if (question.toLowerCase().includes('url')) {
      return (
        <Input
          type="url"
          value={formData[question] || ''}
          onChange={(e) => handleInputChange(question, e.target.value)}
          placeholder="https://example.com"
        />
      );
    }

    // For age input
    if (question.includes('old is your persona')) {
      return (
        <Input
          type="number"
          value={formData[question] || ''}
          onChange={(e) => handleInputChange(question, e.target.value)}
          placeholder="Age"
          min="1"
          max="120"
        />
      );
    }

    // For income input
    if (question.includes('annual income')) {
      return (
        <Input
          type="text"
          value={formData[question] || ''}
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9.]/g, '');
            handleInputChange(question, value ? `$${value}` : '');
          }}
          placeholder="Annual Income"
        />
      );
    }

    // Default to textarea for longer form answers
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

export default BuyerPersona;