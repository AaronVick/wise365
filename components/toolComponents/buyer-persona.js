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
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectItem } from '../ui/select';
import { Card } from '../ui/card';
import FormChat from './FormChat';

const TEMPLATE_NAME = "Worlds Best Buyer Persona";

const BuyerPersona = ({ onComplete, currentUser }) => {
  const [template, setTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [shared, setShared] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formId] = useState(() => `bp_${Date.now()}`);

  useEffect(() => {
    const fetchTemplateAndAnswers = async () => {
      try {
        setLoading(true);
        setError(null);

        // Validate currentUser
        if (!currentUser?.uid) {
          setError('User authentication required');
          return;
        }

        // Fetch template
        const templateQuery = query(
          collection(db, 'resources'),
          where('templateName', '==', TEMPLATE_NAME)
        );
        
        const templateSnapshot = await getDocs(templateQuery);

        if (templateSnapshot.empty) {
          setError('Template not found');
          return;
        }

        const templateData = templateSnapshot.docs[0].data();
        setTemplate(templateData);

        // Fetch previous answers
        const answersQuery = query(
          collection(db, 'resourcesData'),
          where('templateName', '==', TEMPLATE_NAME),
          where('userId', '==', currentUser.uid),
          orderBy('timestamp', 'desc'),
          limit(1)
        );

        const answersSnapshot = await getDocs(answersQuery);

        if (!answersSnapshot.empty) {
          const lastSubmission = answersSnapshot.docs[0].data();
          setFormData(lastSubmission.answers || {});
          setLastUpdated(lastSubmission.timestamp?.toDate());
        }

      } catch (error) {
        console.error('Error fetching template or prior responses:', error);
        setError('Failed to load form data');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!template || !currentUser?.uid) {
      setError('Missing required data');
      return;
    }

    const allQuestionsAnswered = template.sections?.every(
      section => formData[section.question]?.trim()
    );

    if (!allQuestionsAnswered) {
      setError('Please answer all questions before saving.');
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

      if (typeof onComplete === 'function') {
        onComplete();
      }
      
      setFormData({});
      
    } catch (error) {
      console.error('Error saving form data:', error);
      setError('Failed to save form data');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading form...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="p-6">
          <p className="text-red-600">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  if (!template?.sections) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Invalid template format. Please contact support.</p>
      </div>
    );
  }

  const formContent = (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">{template.templateName || TEMPLATE_NAME}</h1>
        {template.description && (
          <p className="text-sm text-gray-500 mb-6">{template.description}</p>
        )}

        {lastUpdated && (
          <p className="text-sm text-gray-500 mb-4">
            Last updated: {lastUpdated.toLocaleString()}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Save
          </Button>
        </form>
      </Card>
    </div>
  );

  return currentUser ? (
    <FormChat
      formName={TEMPLATE_NAME}
      formId={formId}
      projectId={currentUser?.teamId}
      projectName={template?.templateName}
      currentUser={currentUser}
    >
      {formContent}
    </FormChat>
  ) : null;
};

export default BuyerPersona;