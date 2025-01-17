// components/toolComponents/FormChatContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useProgressAnalyzer } from '../milestoneFunnels/ProgressAnalyzer';
import { mapFunnelDataToFunnels } from '../../pages/api/funnelAnalyzer';

const FormChatContext = createContext(null);

export const useFormChat = () => {
  const context = useContext(FormChatContext);
  if (!context) {
    throw new Error('useFormChat must be used within a FormChatProvider');
  }
  return context;
};

export const FormChatProvider = ({
  children,
  formName,
  formId,
  projectId
}) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    template: null,
    history: [],
    progress: null,
    agent: null,
    funnelContext: null,
    loading: true,
    error: null
  });

  // Use existing progress analyzer
  const { analysis, loading: analysisLoading } = useProgressAnalyzer(
    currentUser,
    { name: formName, id: formId },
    null
  );

  // Fetch all necessary form data
  useEffect(() => {
    const fetchFormData = async () => {
      if (!currentUser?.uid || !formName) return;

      try {
        const [
          templateData,
          historyData,
          agentData,
          funnelData
        ] = await Promise.all([
          fetchFormTemplate(),
          fetchFormHistory(),
          fetchFormAgent(),
          fetchFunnelContext()
        ]);

        setFormData({
          template: templateData,
          history: historyData,
          progress: analysis,
          agent: agentData,
          funnelContext: funnelData,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error fetching form data:', error);
        setFormData(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      }
    };

    fetchFormData();
  }, [currentUser, formName, analysis]);

  // Fetch form template
  const fetchFormTemplate = async () => {
    const templateQuery = query(
      collection(db, 'resources'),
      where('templateName', '==', formName)
    );
    const snapshot = await getDocs(templateQuery);
    return snapshot.docs[0]?.data() || null;
  };

  // Fetch form submission history
  const fetchFormHistory = async () => {
    const historyQuery = query(
      collection(db, 'resourcesData'),
      where('userId', '==', currentUser.authenticationID),
      where('templateName', '==', formName),
      orderBy('timestamp', 'desc')
    );
    const snapshot = await getDocs(historyQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  };

  // Fetch appropriate agent
  const fetchFormAgent = async () => {
    const agentQuery = query(
      collection(db, 'agentsDefined'),
      where('formTypes', 'array-contains', formName)
    );
    const snapshot = await getDocs(agentQuery);
    return snapshot.docs[0]?.data() || null;
  };

  // Fetch funnel context
  const fetchFunnelContext = async () => {
    const { funnels } = await mapFunnelDataToFunnels(currentUser.teamId);
    return funnels.find(f => 
      f.forms?.includes(formName) ||
      f.milestones?.some(m => m.formName === formName)
    );
  };

  // Get form field validation
  const validateField = async (fieldName, value) => {
    if (!formData.template) return true;

    const field = formData.template.sections.find(s => 
      s.question === fieldName ||
      s.subQuestions?.some(sq => sq.question === fieldName)
    );

    if (!field) return true;

    // Add your validation logic here
    return true;
  };

  // Track form progress
  const updateProgress = async (updates) => {
    try {
      // Implementation for progress updates
      console.log('Updating progress:', updates);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  // Helper method to get field hints
  const getFieldHint = (fieldName) => {
    if (!formData.template) return '';

    const field = formData.template.sections.find(s => 
      s.question === fieldName ||
      s.subQuestions?.some(sq => sq.question === fieldName)
    );

    return field?.hint || field?.definition || '';
  };

  const contextValue = {
    ...formData,
    analysisLoading,
    validateField,
    updateProgress,
    getFieldHint
  };

  return (
    <FormChatContext.Provider value={contextValue}>
      {children}
    </FormChatContext.Provider>
  );
};

export default FormChatProvider;