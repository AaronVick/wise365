// components/toolComponents/positioning-factors.js

import React, { useState, useEffect } from 'react';
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
import { Card } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Select, SelectItem } from '../ui/select';
import FormChat from './FormChat';

const PositioningFactors = ({ onComplete }) => {
  const auth = useAuth();
  const currentUser = auth?.currentUser;

  const [template, setTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [shared, setShared] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formId] = useState(() => `pf_${Date.now()}`); // Unique ID for this form instance
  const templateName = 'Positioning Factor Worksheet';

  // Fetch template and previous answers
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const q = query(
          collection(db, 'resources'),
          where('templateName', '==', templateName)
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
          where('templateName', '==', templateName),
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
    setFormData(prev => ({
      ...prev,
      [question]: value || '',
    }));
  };

  const handleSubmit = async () => {
    if (!template || !currentUser) return;

    const allQuestionsAnswered = template.sections.every(section =>
      section.subQuestions
        ? section.subQuestions.every(
            subQ => formData[subQ.question]?.trim()
          )
        : formData[section.question]?.trim()
    );

    if (!allQuestionsAnswered) {
      alert('Please answer all questions before saving.');
      return;
    }

    try {
      await addDoc(collection(db, 'resourcesData'), {
        userId: currentUser.uid,
        teamId: currentUser.teamId || '',
        templateName,
        answers: formData,
        shared,
        timestamp: serverTimestamp(),
      });

      alert('Form submitted successfully!');
      setFormData({}); // Clear the form
      onComplete(); // Return to main dashboard
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('An error occurred while submitting the form. Please try again.');
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

  const formContent = (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">{template.templateName}</h2>
        {lastUpdated ? (
          <p className="text-sm text-gray-500 mb-4">
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </p>
        ) : (
          <p className="text-sm text-gray-500 mb-4">
            This is your first time completing this form.
          </p>
        )}

        <form className="space-y-6">
          {template.sections.map((section, index) => (
            <div key={index} className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold text-lg mb-2">{section.question}</h3>
              {section.definition && (
                <p className="text-sm text-gray-600 mb-2">{section.definition}</p>
              )}

              {section.subQuestions ? (
                <div className="space-y-4">
                  {section.subQuestions.map((subQ, subIndex) => (
                    <div key={subIndex} className="mb-4">
                      <label className="block font-medium text-sm mb-1">
                        {subQ.question}
                      </label>
                      <Input
                        value={formData[subQ.question] || ''}
                        onChange={(e) =>
                          handleInputChange(subQ.question, e.target.value)
                        }
                        placeholder="Your answer"
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              ) : section.options ? (
                <Select
                  value={formData[section.question] || ''}
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
                  value={formData[section.question] || ''}
                  onChange={(e) =>
                    handleInputChange(section.question, e.target.value)
                  }
                  placeholder="Your answer"
                  className="w-full"
                />
              )}
            </div>
          ))}

          <div className="flex items-center space-x-2 my-4">
            <Checkbox
              id="shared"
              checked={shared}
              onCheckedChange={(checked) => setShared(checked)}
            />
            <label htmlFor="shared" className="text-sm text-gray-600">
              Share with my team
            </label>
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

  return (
    <FormChat
      formName={templateName}
      formId={formId}
      projectId={currentUser?.teamId}
      projectName={template.templateName}
    >
      {formContent}
    </FormChat>
  );
};

export default PositioningFactors;