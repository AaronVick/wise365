// pages/bestBuyerPersona.js

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  collection,
  doc,
  getDoc,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectItem } from '../components/ui/select';

const BuyerPersona = () => {
  const { currentUser } = useAuth() || {};
  const [template, setTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [shared, setShared] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const q = query(
          collection(db, 'resources'),
          where('templateName', '==', "World’s Best Buyer Persona")
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const templateData = querySnapshot.docs[0].data();
          setTemplate(templateData);
        }
      } catch (error) {
        console.error('Error fetching template:', error);
      }
    };

    const fetchPreviousAnswers = async () => {
      try {
        const q = query(
          collection(db, 'resourcesData'),
          where('userId', '==', currentUser?.uid),
          where('templateName', '==', "World’s Best Buyer Persona"),
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

    if (currentUser) {
      fetchTemplate();
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
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving form data:', error);
    }
  };

  if (!template) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
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
                onChange={(e) => handleInputChange(section.question, e.target.value)}
              >
                <option value="" disabled>
                  Select an option
                </option>
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
          />
          <label className="text-sm">Share with my team</label>
        </div>

        <Button type="button" onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white">
          Save
        </Button>
      </form>
    </div>
  );
};

export default BuyerPersona;
