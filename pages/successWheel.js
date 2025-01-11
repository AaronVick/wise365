// pages/successWheel.js


import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const SuccessWheel = ({ currentUser }) => {
  const [template, setTemplate] = useState(null);
  const [responses, setResponses] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmissionDate, setLastSubmissionDate] = useState(null);
  const [shared, setShared] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchTemplate = async () => {
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
      }
    };

    fetchTemplate();
  }, [currentUser.uid]);

  const handleChange = (question, answer) => {
    setResponses({ ...responses, [question]: answer });
  };

  const handleSubmit = async () => {
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
      router.push('/dashboard'); // Redirect to dashboard or another page
    } catch (error) {
      console.error('Error saving responses:', error);
      alert('An error occurred while saving your responses. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!template) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{template.templateName}</h1>
      <p className="text-gray-600 mb-6">{template.description}</p>

      {lastSubmissionDate && (
        <div className="mb-6 text-sm text-gray-500">
          Last submitted on: {lastSubmissionDate.toLocaleDateString()}{' '}
          {lastSubmissionDate.toLocaleTimeString()}
        </div>
      )}

      {template.sections.map((section, index) => (
        <div key={index} className="mb-6">
          <h2 className="text-lg font-semibold mb-2">{section.question}</h2>
          <p className="text-sm text-gray-500 mb-2">{section.definition}</p>
          <p className="text-sm text-gray-500 mb-4">{section.evaluationCriteria}</p>

          <select
            className="w-full p-2 border rounded"
            value={responses[section.question] || ''}
            onChange={(e) => handleChange(section.question, e.target.value)}
          >
            <option value="" disabled>
              Select your grade
            </option>
            {section.gradingScale.map((grade, i) => (
              <option key={i} value={grade}>
                {grade}
              </option>
            ))}
          </select>
        </div>
      ))}

      <div className="flex items-center mb-6">
        <input
          type="checkbox"
          id="shared"
          className="mr-2"
          checked={shared}
          onChange={(e) => setShared(e.target.checked)}
        />
        <label htmlFor="shared" className="text-sm text-gray-600">
          Share responses with my team
        </label>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2"
      >
        {isSubmitting ? 'Saving...' : 'Save Responses'}
      </Button>
    </div>
  );
};

export default SuccessWheel;
