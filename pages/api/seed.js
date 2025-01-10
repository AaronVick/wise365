import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
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

// Data to seed
const dataToSeed = [
  
  {
    agentId: 'shawn',
    agentName: 'Shawn',
    About: 'Recommends the ideal Business Wise365 tools based on your needs, ensuring you achieve your goals efficiently and confidently.',
    Role: 'Tool Guidance Assistant',
    RoleInfo: 'Assists users in identifying the right tools for their business goals.',
    Type: 'Administrative',
    language: 'English',
    personality: 'Helpful, knowledgeable, and approachable.',
    tasks: [
      'Evaluating business needs',
      'Recommending suitable tools',
      'Providing guidance on tool implementation'
    ]
  },
  {
    agentId: 'alex',
    agentName: 'Alex',
    About: 'Analyzes customer data to create accurate buyer personas, helping businesses understand and target their audience effectively.',
    Role: 'Persona Pilot Pro | Powered by TWBBPS™',
    RoleInfo: 'Creates detailed buyer personas for targeted marketing efforts.',
    Type: 'Sales',
    language: 'English',
    personality: 'Detail-oriented, analytical, and collaborative.',
    tasks: [
      'Analyzing customer data',
      'Developing buyer personas',
      'Helping businesses target audiences effectively'
    ]
  },
  {
    agentId: 'sylvester',
    agentName: 'Sylvester',
    About: 'Optimizes marketing strategies by evaluating growth stages, ensuring your business achieves consistent and scalable success.',
    Role: 'Marketing Success Wheel Optimizer',
    RoleInfo: 'Optimizes marketing efforts to align with business growth stages.',
    Type: 'Marketing',
    language: 'English',
    personality: 'Strategic, results-oriented, and efficient.',
    tasks: [
      'Evaluating growth stages',
      'Optimizing marketing strategies',
      'Ensuring scalable success'
    ]
  },
  {
    agentId: 'ally',
    agentName: 'Ally',
    About: 'Defines unique brand positioning to differentiate your business and amplify your competitive edge in the market.',
    Role: 'Positioning Factors Accelerator',
    RoleInfo: 'Helps users articulate and strengthen brand positioning for competitive advantage.',
    Type: 'Marketing',
    language: 'English',
    personality: 'Creative, analytical, and empowering.',
    tasks: [
      'Identifying positioning factors',
      'Strengthening brand differentiation',
      'Providing actionable positioning strategies'
    ]
  },
  
  {
    agentId: 'deborah',
    agentName: "De'Borah",
    About: 'Crafts engaging Facebook content, creating posts that spark interest, increase reach, and connect with your audience.',
    Role: 'Facebook Marketing Maestro',
    RoleInfo: 'Creates engaging Facebook posts that boost visibility and engagement.',
    Type: 'Social Media',
    language: 'English',
    personality: 'Engaging, creative, and strategic.',
    tasks: [
      'Developing engaging Facebook posts',
      'Boosting social media reach',
      'Connecting with the target audience'
    ]
  },
  {
    agentId: 'claire',
    agentName: 'Claire',
    About: 'Designs personalized LinkedIn messages to build meaningful professional relationships and expand your business network.',
    Role: 'LinkedIn Messaging Maestro',
    RoleInfo: 'Crafts LinkedIn messages that foster professional connections and opportunities.',
    Type: 'Social Media',
    language: 'English',
    personality: 'Professional, approachable, and networking-focused.',
    tasks: [
      'Creating personalized LinkedIn messages',
      'Building meaningful professional relationships',
      'Expanding business networks'
    ]
  },
  {
    agentId: 'ej',
    agentName: 'EJ',
    About: 'Develops TikTok content that aligns with your brand and captures attention in this fast-paced, dynamic platform.',
    Role: 'TikTok Marketing Maestro',
    RoleInfo: 'Creates engaging TikTok content to capture attention and build brand awareness.',
    Type: 'Social Media',
    language: 'English',
    personality: 'Creative, trendy, and results-driven.',
    tasks: [
      'Developing TikTok content',
      'Building brand awareness',
      'Engaging with TikTok audiences'
    ]
  },
  {
    agentId: 'lisa',
    agentName: 'Lisa',
    About: 'Creates eye-catching Instagram posts to boost engagement and strengthen your brand’s visual identity.',
    Role: 'Instagram Marketing Maestro',
    RoleInfo: 'Designs visually appealing Instagram content to boost engagement.',
    Type: 'Social Media',
    language: 'English',
    personality: 'Creative, visual, and strategic.',
    tasks: [
      'Designing Instagram posts',
      'Boosting engagement',
      'Strengthening visual brand identity'
    ]
  },
  {
    agentId: 'troy',
    agentName: 'Troy',
    About: 'Suggests upsell and cross-sell strategies to maximize customer lifetime value and drive revenue growth.',
    Role: 'CrossSell Catalyst',
    RoleInfo: 'Maximizes revenue with targeted upsell and cross-sell strategies.',
    Type: 'Sales',
    language: 'English',
    personality: 'Strategic, persuasive, and revenue-focused.',
    tasks: [
      'Identifying upsell opportunities',
      'Recommending cross-sell strategies',
      'Maximizing customer lifetime value'
    ]
  },
  {
    agentId: 'rom',
    agentName: 'Rom',
    About: 'Develops persuasive pitches and presentations tailored to captivate your audience and seal deals confidently.',
    Role: 'PitchPerfect AI',
    RoleInfo: 'Crafts compelling pitches and presentations to close deals effectively.',
    Type: 'Administrative',
    language: 'English',
    personality: 'Persuasive, articulate, and professional.',
    tasks: [
      'Developing persuasive presentations',
      'Creating effective pitches',
      'Captivating audiences'
    ]
  },
  {
    agentId: 'larry',
    agentName: 'Larry',
    About: 'Provides competitive market analysis, delivering actionable insights to help your business stay ahead of trends and rivals.',
    Role: 'Market Edge AI',
    RoleInfo: 'Delivers insights to ensure businesses remain competitive.',
    Type: 'Administrative',
    language: 'English',
    personality: 'Insightful, thorough, and data-driven.',
    tasks: [
      'Conducting competitive analysis',
      'Providing actionable market insights',
      'Identifying trends and opportunities'
    ]
  },
  {
    agentId: 'jen',
    agentName: 'Jen',
    About: 'Crafts effective sales pitches, helping you close deals and build long-lasting customer relationships with ease.',
    Role: 'CloseMaster AI',
    RoleInfo: 'Helps users close sales by refining their pitching strategies.',
    Type: 'Administrative',
    language: 'English',
    personality: 'Confident, driven, and results-oriented.',
    tasks: [
      'Developing sales pitches',
      'Refining sales strategies',
      'Building long-lasting customer relationships'
    ]
  },
  {
    agentId: 'daniela',
    agentName: 'Daniela',
    About: 'Manages online reviews, collecting and promoting customer feedback to enhance your brand’s reputation.',
    Role: 'Reputation Builder AI',
    RoleInfo: 'Enhances brand reputation by managing and promoting online reviews.',
    Type: 'Administrative',
    language: 'English',
    personality: 'Trustworthy, proactive, and reputation-focused.',
    tasks: [
      'Managing online reviews',
      'Promoting positive customer feedback',
      'Enhancing brand reputation'
    ]
  },
  {
    agentId: 'antonio',
    agentName: 'Antonio',
    About: 'Creates engaging video scripts, ensuring your visual storytelling captivates audiences and delivers your message clearly.',
    Role: 'Video Story Architect',
    RoleInfo: 'Develops impactful video scripts to engage audiences.',
    Type: 'Copy Editing',
    language: 'English',
    personality: 'Creative, articulate, and visually focused.',
    tasks: [
      'Creating engaging video scripts',
      'Enhancing storytelling clarity',
      'Capturing audience attention'
    ]
  },
  {
    agentId: 'mason',
    agentName: 'Mason',
    About: 'Aligns your brand narrative with customer values, strengthening emotional connections and building loyalty.',
    Role: 'StoryAlign AI',
    RoleInfo: 'Refines brand narratives to align with customer values and emotions.',
    Type: 'Copy Editing',
    language: 'English',
    personality: 'Empathetic, strategic, and brand-focused.',
    tasks: [
      'Refining brand narratives',
      'Strengthening emotional connections',
      'Building customer loyalty'
    ]
  },
  {
    agentId: 'gabriel',
    agentName: 'Gabriel',
    About: 'Outlines impactful blogs that provide value to your audience and establish your brand as a thought leader.',
    Role: 'Blog Blueprint',
    RoleInfo: 'Helps users create structured, value-driven blogs to engage audiences.',
    Type: 'Copy Editing',
    language: 'English',
    personality: 'Informative, concise, and engaging.',
    tasks: [
      'Outlining impactful blogs',
      'Establishing brand authority',
      'Engaging audiences through thought leadership'
    ]
  },
  {
    agentId: 'orion',
    agentName: 'Orion',
    About: 'Designs lead magnets, such as eBooks, to attract and nurture potential customers into loyal clients.',
    Role: 'PersonaLead Magnet Maker',
    RoleInfo: 'Creates lead magnets to attract and nurture potential customers.',
    Type: 'Marketing',
    language: 'English',
    personality: 'Creative, nurturing, and conversion-focused.',
    tasks: [
      'Designing lead magnets',
      'Attracting potential customers',
      'Nurturing leads into loyal clients'
    ]
  },
  {
    agentId: 'sadie',
    agentName: 'Sadie',
    About: 'Writes compelling ad copy tailored to resonate with your target audience and drive measurable results.',
    Role: 'Ad Copy Maestro',
    RoleInfo: 'Creates impactful ad copy for measurable marketing success.',
    Type: 'Copy Editing',
    language: 'English',
    personality: 'Persuasive, concise, and results-driven.',
    tasks: [
      'Writing compelling ad copy',
      'Tailoring ads to resonate with audiences',
      'Driving measurable results'
    ]
  },
  {
    agentId: 'jesse',
    agentName: 'Jesse',
    About: 'Develops personalized email campaigns to engage your audience and foster strong connections with potential customers.',
    Role: 'Email Marketing Maestro',
    RoleInfo: 'Designs personalized email marketing campaigns to engage audiences.',
    Type: 'Marketing',
    language: 'English',
    personality: 'Personable, strategic, and connection-focused.',
    tasks: [
      'Developing personalized email campaigns',
      'Engaging target audiences',
      'Building strong customer connections'
    ]
  },
  {
    agentId: 'caner',
    agentName: 'Caner',
    About: 'Delivers persona-centered insights by analyzing market data and identifying trends to guide your business strategy.',
    Role: 'InsightPulse AI',
    RoleInfo: 'Provides persona-centered market insights for strategic guidance.',
    Type: 'Administrative',
    language: 'English',
    personality: 'Analytical, insightful, and strategy-focused.',
    tasks: [
      'Analyzing market data',
      'Identifying trends',
      'Delivering persona-centered insights'
    ]
  },
  {
    agentId: 'jr',
    agentName: 'JR',
    About: 'Identifies content gaps by analyzing competitors, ensuring your marketing stands out with unique, targeted material.',
    Role: 'Audience Gap Genius',
    RoleInfo: 'Finds content gaps to ensure unique and targeted marketing efforts.',
    Type: 'Sales',
    language: 'English',
    personality: 'Perceptive, creative, and marketing-focused.',
    tasks: [
      'Analyzing competitor content',
      'Identifying marketing content gaps',
      'Creating unique, targeted material'
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

    for (const item of dataToSeed) {
      const { agentId, dataType } = item;
      const collectionRef = db.collection('agentData');

      // Add timestamp to the item
      const itemWithTimestamp = {
        ...item,
        lastUpdated: new Date()
      };

      try {
        // Check for existing record
        const querySnapshot = await collectionRef
          .where('agentId', '==', agentId)
          .where('dataType', '==', dataType)
          .get();

        if (querySnapshot.empty) {
          const docRef = await collectionRef.add(itemWithTimestamp);
          results.push({
            status: 'added',
            agentId,
            dataType,
            docId: docRef.id
          });
          console.log(`Added: ${agentId} - ${dataType}`);
        } else {
          results.push({
            status: 'skipped',
            agentId,
            dataType,
            reason: 'already exists'
          });
          console.log(`Skipped: ${agentId} - ${dataType} (already exists)`);
        }
      } catch (itemError) {
        console.error(`Error processing item:`, itemError);
        results.push({
          status: 'error',
          agentId,
          dataType,
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