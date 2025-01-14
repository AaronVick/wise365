// components/toolComponents/success-wheel.js
import React, { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmissionDate, setLastSubmissionDate] = useState(null);
  const [shared, setShared] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplate = async () => {
      if (!currentUser) return;

      try {
        const resourcesRef = collection(db, 'resources');
        const q = query(resourcesRef, where('templateName', '==', 'Marketing Success Wheel'));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docData = querySnapshot.docs[0].data();
          setTemplate(docData);

          // Fetch previous answers
          const resourcesDataRef = collection(db, 'resourcesData');
          const dataQuery = query(
            resourcesDataRef,
            where('templateName', '==', 'Marketing Success Wheel'),
            where('userId', '==', currentUser.uid)
          );
          const dataSnapshot = await getDocs(dataQuery);

          if (!dataSnapshot.empty) {
            const lastSubmission = dataSnapshot.docs[0].data();
            setResponses(
              lastSubmission.responses.reduce((acc, item) => {
                acc[item.question] = item.answer;
                return acc;
              }, {})
            );
            setLastSubmissionDate(lastSubmission.timestamp?.toDate());
          }
        }
      } catch (error) {
        console.error('Error fetching template or prior responses:', error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchTemplate();
    }
  }, [currentUser]);

  const handleChange = (question, answer) => {
    setResponses({ ...responses, [question]: answer });
  };

  const handleSubmit = async () => {
    if (!template || !currentUser) return;

    if (Object.keys(responses).length !== template.sections.length) {
      alert('Please answer all questions before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const resourcesDataRef = collection(db, 'resourcesData');
      const formattedResponses = template.sections.map((section) => ({
        question: section.question,
        answer: responses[section.question],
        definition: section.definition,
        evaluationCriteria: section.evaluationCriteria,
      }));

      await addDoc(resourcesDataRef, {
        templateName: template.templateName,
        userId: currentUser.uid,
        teamId: currentUser.teamId || null,
        shared,
        responses: formattedResponses,
        timestamp: serverTimestamp(),
      });

      alert('Your responses have been saved successfully!');
      setResponses({}); // Clear the form
      onComplete(); // Return to main dashboard
    } catch (error) {
      console.error('Error saving responses:', error);
      alert('An error occurred while saving your responses. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="ml-4 text-gray-600">Loading template...</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Template not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">{template.templateName}</h1>
        <p className="text-gray-600 mb-6">{template.description}</p>

        {lastSubmissionDate ? (
          <div className="mb-6 text-sm text-gray-500">
            Last submitted on: {lastSubmissionDate.toLocaleDateString()}{' '}
            {lastSubmissionDate.toLocaleTimeString()}
          </div>
        ) : (
          <div className="mb-6 text-sm text-gray-500">
            This is your first time completing this form.
          </div>
        )}

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
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2"
        >
          {isSubmitting ? 'Saving...' : 'Save Responses'}
        </Button>
      </Card>
    </div>
  );
};

export default SuccessWheel;