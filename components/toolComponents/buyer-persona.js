// components/toolComponents/BuyerPersona.js

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
import Textarea from '../ui/textarea';
import { Select, SelectItem } from '../ui/select';
import { Card } from '../ui/card';

const BuyerPersona = ({ onComplete }) => {
  const { currentUser } = useAuth() || {};
  const [template, setTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [shared, setShared] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const q = query(
          collection(db, 'resources'),
          where('templateName', '==', "World's Best Buyer Persona")
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const templateData = querySnapshot.docs[0].data();
          setTemplate(templateData);
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
          where('templateName', '==', "World's Best Buyer Persona"),
          orderBy('timestamp', 'desc')
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const lastAnswer = querySnapshot.docs[0].data();
          setFormData(lastAnswer.answers);
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

  const handleSubmit = async () => {
    if (!template || !currentUser) return;

    const allQuestionsAnswered = template.sections.every((section) =>
      formData[section.question]?.trim()
    );

    if (!allQuestionsAnswered) {
      alert('Please answer all questions before saving.');
      return;
    }

    try {
      await addDoc(collection(db, 'resourcesData'), {
        userId: currentUser.uid,
        teamId: currentUser.teamId || '',
        templateName: template.templateName,
        answers: formData,
        shared,
        timestamp: serverTimestamp(),
      });
      
      alert('Form saved successfully!');
      setFormData({}); // Clear the form
      onComplete(); // Return to main dashboard
    } catch (error) {
      console.error('Error saving form data:', error);
      alert('Error saving form data. Please try again.');
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
        <p>Template not found</p>
      </div>
    );
  }

  return (
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

              {section.options ? (
                <Select
                  value={formData[section.question] || ''}
                  onValueChange={(value) => handleInputChange(section.question, value)}
                >
                  <SelectItem value="">Select an option</SelectItem>
                  {section.options.map((option, idx) => (
                    <SelectItem key={idx} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </Select>
              ) : section.evaluationCriteria ? (
                <Textarea
                  value={formData[section.question] || ''}
                  onChange={(e) => handleInputChange(section.question, e.target.value)}
                  placeholder="Your answer"
                />
              ) : (
                <Input
                  value={formData[section.question] || ''}
                  onChange={(e) => handleInputChange(section.question, e.target.value)}
                  placeholder="Your answer"
                />
              )}
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
};

export default BuyerPersona;