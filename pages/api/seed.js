// pages/api/seed.js

// pages/api/seed.js

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  const serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
  };

  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();

// Full JSON data for seeding
const dataToSeed = [
  {
    templateName: "Marketing Success Wheel",
    description: "A self-assessment form for grading your marketing success across various categories.",
    sections: [
      {
        question: "Awareness Grade",
        definition: "The ability to make potential customers aware of your brand, products, or services.",
        evaluationCriteria: "Reach of marketing campaigns, brand recognition, visibility across different channels, and ability to attract attention from target audiences.",
        gradingScale: [
          "A: Rockstar status! You're crushing it!",
          "B: Nice! You're above average and doing well.",
          "C: You're average, hanging in there with the pack.",
          "D: Below average. Not quite there yet, but there's potential!",
          "F: Ouch! Looks like there's some room for improvement."
        ]
      },
      {
        question: "Engagement Grade",
        definition: "The level of interaction and involvement your audience has with your content or brand.",
        evaluationCriteria: "Social media interactions, website engagement metrics (time on site, page views), and email open/click rates.",
        gradingScale: [
          "A: Rockstar status! You're crushing it!",
          "B: Nice! You're above average and doing well.",
          "C: You're average, hanging in there with the pack.",
          "D: Below average. Not quite there yet, but there's potential!",
          "F: Ouch! Looks like there's some room for improvement."
        ]
      },
      {
        question: "Lead Generation Grade",
        definition: "The process of attracting and capturing potential customers' interest to build a sales pipeline.",
        evaluationCriteria: "Number of leads generated, lead quality, lead conversion rates, and effectiveness of lead magnets and calls to action.",
        gradingScale: [
          "A: Rockstar status! You're crushing it!",
          "B: Nice! You're above average and doing well.",
          "C: You're average, hanging in there with the pack.",
          "D: Below average. Not quite there yet, but there's potential!",
          "F: Ouch! Looks like there's some room for improvement."
        ]
      },
      {
        question: "Conversion Optimization Grade",
        definition: "Improving the effectiveness of marketing efforts to turn leads into customers.",
        evaluationCriteria: "Conversion rates on landing pages, the effectiveness of sales funnels, and optimization of user experience to drive purchases or sign-ups.",
        gradingScale: [
          "A: Rockstar status! You're crushing it!",
          "B: Nice! You're above average and doing well.",
          "C: You're average, hanging in there with the pack.",
          "D: Below average. Not quite there yet, but there's potential!",
          "F: Ouch! Looks like there's some room for improvement."
        ]
      },
      {
        question: "WOW Grade",
        definition: "Exceeding customer expectations and creating memorable experiences post-purchase.",
        evaluationCriteria: "Customer satisfaction scores, customer loyalty, personalized follow-ups, and surprise-and-delight initiatives.",
        gradingScale: [
          "A: Rockstar status! You're crushing it!",
          "B: Nice! You're above average and doing well.",
          "C: You're average, hanging in there with the pack.",
          "D: Below average. Not quite there yet, but there's potential!",
          "F: Ouch! Looks like there's some room for improvement."
        ]
      },
      {
        question: "Customer Ladder Grade",
        definition: "Strategies to enhance customer loyalty by encouraging existing customers to make more purchases and try additional products or services.",
        evaluationCriteria: "Upsell and cross-sell success rates, average order value, and effectiveness of personalized recommendations.",
        gradingScale: [
          "A: Rockstar status! You're crushing it!",
          "B: Nice! You're above average and doing well.",
          "C: You're average, hanging in there with the pack.",
          "D: Below average. Not quite there yet, but there's potential!",
          "F: Ouch! Looks like there's some room for improvement."
        ]
      },
      {
        question: "Reviews & Testimonials Grade",
        definition: "The strategy for encouraging and managing customer reviews and testimonials.",
        evaluationCriteria: "Quantity and quality of reviews, average star ratings, response time to reviews, and use of reviews in marketing materials.",
        gradingScale: [
          "A: Rockstar status! You're crushing it!",
          "B: Nice! You're above average and doing well.",
          "C: You're average, hanging in there with the pack.",
          "D: Below average. Not quite there yet, but there's potential!",
          "F: Ouch! Looks like there's some room for improvement."
        ]
      },
      {
        question: "Referrals Grade",
        definition: "Encouraging satisfied customers to refer new customers to your business.",
        evaluationCriteria: "Number of referrals generated, effectiveness of referral programs, and conversion rates of referred customers.",
        gradingScale: [
          "A: Rockstar status! You're crushing it!",
          "B: Nice! You're above average and doing well.",
          "C: You're average, hanging in there with the pack.",
          "D: Below average. Not quite there yet, but there's potential!",
          "F: Ouch! Looks like there's some room for improvement."
        ]
      }
    ]
  },
  {
    templateName: "World’s Best Buyer Persona",
    description: "Builds detailed buyer personas based on the award-winning World's Best Buyer Persona System.",
    sections: [
      {
        question: "What is your website URL?",
        definition: "",
        evaluationCriteria: ""
      },
      {
        question: "What name are you giving your persona?",
        definition: "",
        evaluationCriteria: ""
      },
      {
        question: "How old is your persona?",
        definition: "",
        evaluationCriteria: ""
      },
      {
        question: "What is the annual income of your persona?",
        definition: "",
        evaluationCriteria: ""
      },
      {
        question: "What is the job title or role of your persona?",
        definition: "",
        evaluationCriteria: ""
      },
      {
        question: "What situation is your persona in that needs to be resolved?",
        definition: "",
        evaluationCriteria: ""
      },
      {
        question: "What does your persona want to achieve to resolve this situation?",
        definition: "",
        evaluationCriteria: ""
      },
      {
        question: "What problem(s) has this situation caused for your persona?",
        definition: "",
        evaluationCriteria: ""
      },
      {
        question: "These problems lead to what emotions for your persona?",
        definition: "",
        evaluationCriteria: ""
      },
      {
        question: "Which of Maslow's Hierarchy of Needs is most relevant to these emotions for this persona?",
        definition: "Maslow's Hierarchy of Needs categorizes human motivations into levels, including physiological needs, safety, love & belonging, esteem, and self-actualization.",
        evaluationCriteria: "Identify the primary need driving the persona's emotional responses and motivations.",
        options: ["Physiological", "Safety", "Love & Belonging", "Esteem", "Self-Actualization"]
      },
      {
        question: "What are the persona's Action Beliefs (Gains they expect from acting)?",
        definition: "",
        evaluationCriteria: ""
      },
      {
        question: "What are the persona's Inaction Beliefs (Pains they fear from not acting)?",
        definition: "",
        evaluationCriteria: ""
      },
      {
        question: "What are possible triggering events that resulted in the persona taking action now?",
        definition: "",
        evaluationCriteria: ""
      },
      {
        question: "What is this persona seeing in the marketplace as it pertains to this situation?",
        definition: "",
        evaluationCriteria: ""
      },
      {
        question: "What is this persona being told or hearing from their peers and trusted advisors?",
        definition: "",
        evaluationCriteria: ""
      },
      {
        question: "What is this persona doing or considering to resolve this situation?",
        definition: "",
        evaluationCriteria: ""
      },
      {
        question: "What are your positioning factors that differentiate you in the market?",
        definition: "",
        evaluationCriteria: ""
      },
      {
        question: "Which of Maslow's Needs do your Positioning Factors satisfy?",
        definition: "Maslow's Hierarchy of Needs categorizes human motivations into levels, including physiological needs, safety, love & belonging, esteem, and self-actualization.",
        evaluationCriteria: "Explain how your positioning factors address specific levels of need in Maslow's framework.",
        options: ["Physiological", "Safety", "Love & Belonging", "Esteem", "Self-Actualization"]
      },
      {
        question: "What is your T.I.N.B (There Is No B option, as you are the best solution for this persona)?",
        definition: "",
        evaluationCriteria: ""
      },
      {
        question: "Which of Maslow's Needs must be met for the persona to realize you are their T.I.N.B?",
        definition: "Maslow's Hierarchy of Needs categorizes human motivations into levels, including physiological needs, safety, love & belonging, esteem, and self-actualization.",
        evaluationCriteria: "Describe the needs that must be fulfilled for the persona to recognize your solution as their best option.",
        options: ["Physiological", "Safety", "Love & Belonging", "Esteem", "Self-Actualization"]
      }
    ]
  },
  {
    templateName: "Positioning Factor Worksheet",
    description: "A structured worksheet to identify and articulate the elements that set your business apart from competitors.",
    sections: [
      {
        question: "Website URL",
        definition: "Provide the URL for your business website.",
        evaluationCriteria: ""
      },
      {
        question: "Step 1: Reflect on Your Strengths",
        definition: "What are the top three strengths that your business has that set it apart from your competitors?",
        evaluationCriteria: "Identify key areas of differentiation that competitors cannot easily replicate.",
        subQuestions: [
          { question: "Strength 1" },
          { question: "Strength 2" },
          { question: "Strength 3" }
        ]
      },
      {
        question: "Step 2: Identify Unique Attributes",
        definition: "What specific attributes or qualities of your products or services make them different from others in the market?",
        evaluationCriteria: "Focus on unique product qualities like eco-friendliness, customization, or patents.",
        subQuestions: [
          { question: "Unique Attribute 1" },
          { question: "Unique Attribute 2" },
          { question: "Unique Attribute 3" }
        ]
      },
      {
        question: "Step 3: Highlight Recognitions and Achievements",
        definition: "List any awards, certifications, or industry recognitions your business has received.",
        evaluationCriteria: "Highlight aspects that boost credibility and instill trust.",
        subQuestions: [
          { question: "Award/Recognition 1" },
          { question: "Award/Recognition 2" },
          { question: "Award/Recognition 3" }
        ]
      },
      {
        question: "Step 4: Focus on Guarantees and Warranties",
        definition: "Do you offer any guarantees or warranties that demonstrate your confidence in your products or services?",
        evaluationCriteria: "Highlight how these reduce risk for customers.",
        subQuestions: [
          { question: "Guarantee/Warranty 1" },
          { question: "Guarantee/Warranty 2" },
          { question: "Guarantee/Warranty 3" }
        ]
      },
      {
        question: "Step 5: Define Your Market and Industry Focus",
        definition: "Which specific markets or industries does your business specialize in?",
        evaluationCriteria: "Identify areas of expertise or niche focus that give you an edge.",
        subQuestions: [
          { question: "Industry/Market Focus 1" },
          { question: "Industry/Market Focus 2" },
          { question: "Industry/Market Focus 3" }
        ]
      },
      {
        question: "Step 6: Highlight Customer Success Stories",
        definition: "Do you have any customer testimonials or case studies that illustrate the unique value you provide?",
        evaluationCriteria: "Highlight real-world examples demonstrating your impact.",
        subQuestions: [
          { question: "Testimonial/Case Study 1" },
          { question: "Testimonial/Case Study 2" },
          { question: "Testimonial/Case Study 3" }
        ]
      }
    ]
  }
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Starting seed process...');
    const results = [];
    const collectionRef = db.collection('resources');

    for (const item of dataToSeed) {
      const { templateName } = item;

      try {
        // Check if the template already exists
        const querySnapshot = await collectionRef
          .where('templateName', '==', templateName)
          .get();

        if (querySnapshot.empty) {
          // Add new template
          const docRef = await collectionRef.add({
            ...item,
            lastUpdated: new Date() // Optional field for tracking updates
          });
          results.push({
            status: 'added',
            templateName,
            docId: docRef.id
          });
          console.log(`Added template: ${templateName}`);
        } else {
          results.push({
            status: 'skipped',
            templateName,
            reason: 'already exists'
          });
          console.log(`Skipped template: ${templateName} (already exists)`);
        }
      } catch (itemError) {
        console.error(`Error processing template ${templateName}:`, itemError);
        results.push({
          status: 'error',
          templateName,
          error: itemError.message
        });
      }
    }

    return res.status(200).json({
      message: 'Seeding process completed',
      results
    });
  } catch (error) {
    console.error('Error in seed process:', error);
    return res.status(500).json({
      error: 'Error seeding data',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
