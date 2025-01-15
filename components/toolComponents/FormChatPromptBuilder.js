// components/toolComponents/FormChatPromptBuilder.js

import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';

/**
 * Builds comprehensive context for form assistance
 */
export const buildFormAssistancePrompt = async ({
  formName,
  formTemplate,
  userHistory,
  analysis,
  agentData,
  userName,
  teamId
}) => {
  try {
    // Get form requirements and dependencies
    const formRequirements = await getFormRequirements(formName);
    
    // Get related funnel data
    const funnelContext = await getFunnelContext(formName, teamId);

    // Get team progress if available
    const teamProgress = await getTeamProgress(teamId, formName);
    
    // Build the comprehensive prompt
    return `
Role: Form Assistance Specialist
${agentData?.prompt || 'You are an AI assistant specialized in helping users complete forms accurately and effectively.'}

User Context:
- Name: ${userName || 'User'}
- Previous submissions: ${userHistory?.length || 0}
- Last submission: ${userHistory?.[0]?.timestamp ? new Date(userHistory[0].timestamp.toDate()).toLocaleDateString() : 'None'}
${teamProgress ? `- Team Progress: ${teamProgress}` : ''}

Form Details:
${formTemplate ? `
Name: ${formTemplate.templateName}
Purpose: ${formTemplate.description}
Total Sections: ${formTemplate.sections?.length || 0}
Key Requirements:
${formRequirements.map(req => `- ${req}`).join('\n')}

Section Overview:
${formTemplate.sections?.map(section => `
- ${section.question}
  Purpose: ${section.definition || 'Not specified'}
  ${section.evaluationCriteria ? `Criteria: ${section.evaluationCriteria}` : ''}
`).join('\n')}
` : 'Form template not available'}

${funnelContext ? `
Funnel Context:
${funnelContext}
` : ''}

Current Analysis:
${analysis ? `
Status: ${analysis.status}
Progress: ${analysis.progress || 0}%
Key Insights:
${analysis.insights?.map(insight => `- ${insight}`).join('\n') || 'No insights available'}
Required Actions:
${analysis.nextSteps?.map(step => `- ${step}`).join('\n') || 'No specific actions required'}
` : 'No current analysis available'}

Instructions for Assistance:
1. Always start by understanding the user's specific question or concern
2. Provide clear, step-by-step guidance for form completion
3. Explain the purpose and importance of each section when discussing it
4. Offer relevant examples that match the user's industry or context
5. Reference their previous submissions when applicable for context
6. Help users understand how this form connects to their overall progress
7. Provide actionable recommendations based on their current needs
8. If a user seems stuck, proactively suggest next steps or clarifications

Best Practices for Responses:
- Keep explanations clear and concise
- Use bullet points for multiple steps or requirements
- Provide specific examples when explaining complex concepts
- Reference relevant sections directly when answering questions
- Acknowledge previous work and progress
- Maintain a supportive and encouraging tone

Important Notes:
- All form submissions are part of the user's progress tracking
- Users may need guidance on both technical and conceptual aspects
- Some sections may require examples or additional context
- Previous submissions can be referenced for improvement suggestions

Please maintain a professional, helpful tone while guiding the user through their form completion process.
`.trim();
  } catch (error) {
    console.error('Error building form assistance prompt:', error);
    // Return a basic prompt if there's an error
    return `
You are a form assistance specialist helping users complete the ${formName} form.
Please provide clear guidance and answer their questions about form completion.
Focus on being helpful and clear in your explanations.
`.trim();
  }
};

/**
 * Get form-specific requirements and dependencies
 */
const getFormRequirements = async (formName) => {
  try {
    const requirementsRef = collection(db, 'formRequirements');
    const q = query(
      requirementsRef,
      where('formName', '==', formName)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0].data().requirements || [];
    }
    return [];
  } catch (error) {
    console.error('Error getting form requirements:', error);
    return [];
  }
};

/**
 * Get related funnel context for the form
 */
const getFunnelContext = async (formName, teamId) => {
  try {
    const funnelsRef = collection(db, 'funnels');
    const q = query(
      funnelsRef,
      where('forms', 'array-contains', formName)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return '';

    const funnelData = snapshot.docs[0].data();
    const teamProgress = teamId ? await getTeamFunnelProgress(teamId, funnelData.id) : null;
    
    return `
Funnel: ${funnelData.name}
Purpose: ${funnelData.description || 'Not specified'}
Current Stage: ${funnelData.currentMilestone || 'Not specified'}
${teamProgress ? `Team Progress: ${teamProgress}` : ''}
Next Milestones: ${funnelData.nextMilestones?.join(', ') || 'None specified'}
Related Forms: ${funnelData.forms?.join(', ') || 'None specified'}
`.trim();
  } catch (error) {
    console.error('Error getting funnel context:', error);
    return '';
  }
};

/**
 * Get team's progress on form completion
 */
const getTeamProgress = async (teamId, formName) => {
  if (!teamId) return null;
  
  try {
    const resourcesDataRef = collection(db, 'resourcesData');
    const q = query(
      resourcesDataRef,
      where('teamId', '==', teamId),
      where('templateName', '==', formName),
      where('status', '==', 'completed')
    );
    const snapshot = await getDocs(q);
    
    return `${snapshot.docs.length} team members have completed this form`;
  } catch (error) {
    console.error('Error getting team progress:', error);
    return null;
  }
};

/**
 * Get team's progress in the funnel
 */
const getTeamFunnelProgress = async (teamId, funnelId) => {
  try {
    const progressRef = collection(db, 'funnelData');
    const q = query(
      progressRef,
      where('teamId', '==', teamId),
      where('funnelId', '==', funnelId)
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const progressData = snapshot.docs[0].data();
      return `${progressData.progress}% complete in this funnel`;
    }
    return null;
  } catch (error) {
    console.error('Error getting team funnel progress:', error);
    return null;
  }
};

/**
 * Build context-aware follow-up prompts
 */
export const buildFollowUpPrompt = async ({
  formName,
  currentResponse,
  previousResponses,
  userQuery,
  formTemplate,
  analysis
}) => {
  const completedSections = Object.keys(currentResponse || {}).length;
  const totalSections = formTemplate?.sections?.length || 0;
  const remainingSections = totalSections - completedSections;

  let sectionSpecificContext = '';
  if (currentResponse && formTemplate) {
    const currentSection = formTemplate.sections.find(s => 
      !currentResponse[s.question]?.trim()
    );
    if (currentSection) {
      sectionSpecificContext = `
Current Section Focus:
- Name: ${currentSection.question}
- Purpose: ${currentSection.definition || 'Not specified'}
- Requirements: ${currentSection.evaluationCriteria || 'None specified'}
`;
    }
  }

  return `
Based on the user's current query about ${formName}:
"${userQuery}"

Form Progress:
- Completed sections: ${completedSections}
- Remaining sections: ${remainingSections}
- Overall completion: ${Math.round((completedSections / totalSections) * 100)}%

${sectionSpecificContext}

Previous Response History:
${previousResponses?.length ? `${previousResponses.length} previous responses available` : 'No previous responses'}

Current Analysis:
${analysis ? `
- Status: ${analysis.status}
- Blockers: ${analysis.blockers?.join(', ') || 'None'}
- Recommended actions: ${analysis.nextSteps?.join(', ') || 'None specified'}
` : 'No current analysis available'}

Please provide specific guidance to help the user proceed with their form completion, taking into account their current progress and any challenges they're facing.

Focus on:
1. Answering their specific question
2. Providing context for how this fits into their overall progress
3. Suggesting next steps after addressing their current concern
4. Offering examples if relevant to their query
`.trim();
};

/**
 * Build error resolution prompts
 */
export const buildErrorHandlingPrompt = async ({
  formName,
  errorType,
  currentSection,
  formTemplate,
  userHistory
}) => {
  // Get section details
  const sectionDetails = formTemplate?.sections?.find(s => 
    s.question === currentSection
  );

  // Get common solutions for this error type
  const solutions = await getErrorSolutions(errorType, formName);

  return `
A user has encountered an issue with the ${formName} form:

Error Information:
- Type: ${errorType}
- Section: ${currentSection}
${sectionDetails ? `
Section Details:
- Purpose: ${sectionDetails.definition || 'Not specified'}
- Requirements: ${sectionDetails.evaluationCriteria || 'None specified'}
` : ''}

User Context:
- Previous submissions: ${userHistory?.length || 0}
- Current attempt status: Error in ${currentSection}

Common Solutions:
${solutions.map(sol => `- ${sol}`).join('\n')}

Please help the user by:
1. Explaining the error in user-friendly terms
2. Providing clear steps to resolve the issue
3. Offering guidance to prevent similar errors
4. Suggesting how to proceed after resolution

Remember to be encouraging and supportive while helping them overcome this challenge.
`.trim();
};

/**
 * Build validation feedback prompts
 */
export const buildValidationPrompt = async ({
  formName,
  validationIssues,
  currentSection,
  formTemplate,
  userHistory
}) => {
  // Get section requirements
  const sectionDetails = formTemplate?.sections?.find(s => 
    s.question === currentSection
  );

  // Get related examples
  const examples = await getValidationExamples(formName, currentSection);

  return `
Validation Review for ${formName}:

Section: ${currentSection}
${sectionDetails ? `
Purpose: ${sectionDetails.definition}
Requirements: ${sectionDetails.evaluationCriteria}
` : ''}

Current Issues:
${validationIssues.map(issue => `- ${issue}`).join('\n')}

Example Solutions:
${examples.map(example => `- ${example}`).join('\n')}

Previous Submissions: ${userHistory?.length || 0}

Please help the user by:
1. Explaining each validation issue clearly
2. Providing specific examples of valid responses
3. Offering guidance on how to meet the requirements
4. Suggesting improvements based on the form's purpose

Remember to:
- Use clear, non-technical language
- Provide specific examples where helpful
- Explain why each requirement matters
- Offer constructive suggestions for improvement
`.trim();
};

/**
 * Get common solutions for error types
 */
const getErrorSolutions = async (errorType, formName) => {
  try {
    const solutionsRef = collection(db, 'errorSolutions');
    const q = query(
      solutionsRef,
      where('errorType', '==', errorType),
      where('formName', '==', formName)
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      return snapshot.docs[0].data().solutions || [];
    }
    
    // Default solutions if none found
    return [
      'Review the section requirements carefully',
      'Ensure all required fields are filled out',
      'Check for any formatting issues in your responses',
      'Try saving your progress and returning to the section later'
    ];
  } catch (error) {
    console.error('Error getting error solutions:', error);
    return [];
  }
};

/**
 * Get relevant validation examples
 */
const getValidationExamples = async (formName, section) => {
  try {
    const examplesRef = collection(db, 'formExamples');
    const q = query(
      examplesRef,
      where('formName', '==', formName),
      where('section', '==', section)
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      return snapshot.docs[0].data().examples || [];
    }
    
    // Default examples if none found
    return [
      'Ensure your response is clear and specific',
      'Include relevant details and context',
      'Follow any formatting guidelines provided',
      'Address all aspects of the question'
    ];
  } catch (error) {
    console.error('Error getting validation examples:', error);
    return [];
  }
};

export default {
  buildFormAssistancePrompt,
  buildFollowUpPrompt,
  buildErrorHandlingPrompt,
  buildValidationPrompt
};