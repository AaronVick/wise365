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
  limit
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import firebaseService from '../../lib/services/firebaseService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectItem } from '../ui/select';
import { Card } from '../ui/card';
import FormChat from './FormChat';

const TEMPLATE_NAME = "Positioning Factor Worksheet";

const PositioningFactors = ({ onComplete, currentUser }) => {
  const [template, setTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [shared, setShared] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formId] = useState(() => `pf_${Date.now()}`);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchTemplateAndAnswers = async () => {
      console.log('Initiating template and answers fetch', { currentUser });
      try {
        setLoading(true);
        setError(null);

        if (!currentUser?.uid) {
          console.error('No user ID found in currentUser object', { currentUser });
          setError('User authentication required');
          return;
        }

        // Initialize firebase service with user
        firebaseService.setCurrentUser(currentUser);
        console.log('Firebase service initialized with user', { userId: currentUser.uid });

        // Parallel fetch of template and user data
        const [templateData, userData] = await Promise.all([
          fetchTemplate(),
          fetchUserData()
        ]);

        console.log('Template and user data fetched', { 
          templateFound: !!templateData,
          userDataFound: !!userData 
        });

        if (!templateData || !userData) {
          throw new Error('Failed to fetch required data');
        }

        // Fetch previous answers
        const previousAnswers = await fetchPreviousAnswers(currentUser.uid);
        console.log('Previous answers fetched', { 
          hasAnswers: !!previousAnswers,
          answersCount: Object.keys(previousAnswers?.answers || {}).length 
        });

        // Set states
        setTemplate(templateData);
        if (previousAnswers) {
          setFormData(previousAnswers.answers || {});
          setLastUpdated(previousAnswers.timestamp?.toDate());
          setShared(previousAnswers.shared || false);
        }

      } catch (error) {
        console.error('Error in fetchTemplateAndAnswers:', error);
        setError(error.message || 'Failed to load form data');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplateAndAnswers();
  }, [currentUser?.uid]);

  const fetchTemplate = async () => {
    try {
      // Try firebaseService first
      const template = await firebaseService.get('resources', TEMPLATE_NAME);
      if (template) {
        console.log('Template fetched from firebaseService', { templateName: TEMPLATE_NAME });
        return template;
      }

      // Fallback to direct Firebase query
      const resourcesRef = collection(db, 'resources');
      const templateQuery = query(
        resourcesRef,
        where('templateName', '==', TEMPLATE_NAME)
      );
      
      const templateSnapshot = await getDocs(templateQuery);
      console.log('Template fetched from Firebase', { 
        found: !templateSnapshot.empty,
        templateName: TEMPLATE_NAME 
      });

      if (templateSnapshot.empty) {
        throw new Error('Template not found');
      }

      return templateSnapshot.docs[0].data();
    } catch (error) {
      console.error('Error fetching template:', error);
      throw error;
    }
  };

  const fetchUserData = async () => {
    try {
      const userData = await firebaseService.get('users', currentUser.uid);
      console.log('User data fetched', { 
        userId: currentUser.uid,
        found: !!userData 
      });
      return userData;
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  };

  const fetchPreviousAnswers = async (userId) => {
    try {
      // Try firebaseService first
      const previousAnswers = await firebaseService.queryCollection('resourcesData', {
        where: [
          { field: 'templateName', operator: '==', value: TEMPLATE_NAME },
          { field: 'userId', operator: '==', value: userId }
        ],
        orderBy: [{ field: 'timestamp', direction: 'desc' }],
        limit: 1
      });

      if (previousAnswers?.length) {
        return previousAnswers[0];
      }

      // Fallback to direct Firebase query
      const answersRef = collection(db, 'resourcesData');
      const answersQuery = query(
        answersRef,
        where('templateName', '==', TEMPLATE_NAME),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(1)
      );

      const answersSnapshot = await getDocs(answersQuery);
      return answersSnapshot.empty ? null : answersSnapshot.docs[0].data();

    } catch (error) {
      console.error('Error fetching previous answers:', error);
      throw error;
    }
  };

  const handleInputChange = (question, value) => {
    console.log('Input change detected', { question, value });
    setFormData(prev => ({
      ...prev,
      [question]: value,
    }));
  };

  const validateForm = () => {
    if (!template?.sections) return false;
    
    const unansweredQuestions = template.sections
      .filter(section => !formData[section.question]?.trim())
      .map(section => section.question);

    console.log('Form validation', { 
      totalQuestions: template.sections.length,
      unansweredQuestions 
    });

    return unansweredQuestions.length === 0 ? true : unansweredQuestions;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submission initiated', { formData });
    
    if (!template || !currentUser?.uid) {
      console.error('Missing required data for submission', { 
        hasTemplate: !!template,
        hasUserId: !!currentUser?.uid 
      });
      setError('Missing required data');
      return;
    }

    const validation = validateForm();
    if (validation !== true) {
      console.warn('Form validation failed', { unansweredQuestions: validation });
      setError(`Please answer all questions: ${validation.join(', ')}`);
      return;
    }

    setIsSaving(true);
    try {
      const submissionData = {
        userId: currentUser.uid,
        teamId: currentUser.teamId || '',
        templateName: TEMPLATE_NAME,
        answers: formData,
        shared,
        timestamp: serverTimestamp(),
      };

      console.log('Preparing to save submission', submissionData);

      // Try firebaseService first
      try {
        await firebaseService.create('resourcesData', submissionData);
        console.log('Submission saved via firebaseService');
      } catch (serviceError) {
        console.warn('firebaseService save failed, falling back to direct Firebase', serviceError);
        // Fallback to direct Firebase
        await addDoc(collection(db, 'resourcesData'), submissionData);
        console.log('Submission saved via direct Firebase');
      }

      if (typeof onComplete === 'function') {
        onComplete();
      }
      
      setFormData({});
      
    } catch (error) {
      console.error('Error saving form data:', error);
      setError('Failed to save form data: ' + error.message);
    } finally {
      setIsSaving(false);
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

  const renderField = (section) => {
    if (section.options) {
      return (
        <Select
          value={formData[section.question] || ''}
          onValueChange={(value) => handleInputChange(section.question, value)}
        >
          {section.options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </Select>
      );
    }

    return (
      <Textarea
        value={formData[section.question] || ''}
        onChange={(e) => handleInputChange(section.question, e.target.value)}
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
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
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

export default PositioningFactors;