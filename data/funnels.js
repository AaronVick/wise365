// Full JSON data for seeding
const funnels = 
[
  {
    "name": "Sales Enablement Funnel",
    "description": "Build and optimize strategies to close deals effectively and improve sales outcomes using personalized approaches.",
    "priority": 4,
    "level": 3,
    "dependencies": ["Lead Generation Funnel"],
    "entryCriteria": {
      "mswScore": null,
      "reportedChallenges": ["Low close rates", "Sales process inefficiencies"]
    },
    "responsibleAgents": {
      "lead": "Jen (CloseMaster AI)",
      "supporting": ["Aaron (TINB Builder)", "JR (Audience Gap Genius)"]
    },
    "formsNeeded": ["Sales Pipeline Assessment Form"],
    "milestones": [
      {
        "name": "Evaluate Sales Pipeline",
        "description": "Identify weak points in the sales pipeline and propose solutions.",
        "dataSource": "conversationId",
        "dataPath": "userData.salesPipeline",
        "validationLogic": "Check if salesPipeline includes bottleneck details.",
        "conversationId": "salesPipelineConversation",
        "projectName": "Sales Pipeline Evaluation",
        "priority": 1,
        "kpis": ["Close rate improvements"]
      },
      {
        "name": "Personalize Sales Scripts",
        "description": "Implement personalized sales scripts for top customer segments.",
        "dataSource": "conversationId",
        "dataPath": "userData.salesScripts",
        "validationLogic": "Ensure salesScripts includes tailored messaging.",
        "conversationId": "salesScriptsConversation",
        "projectName": "Sales Script Personalization",
        "priority": 2,
        "kpis": ["Average deal size increases"]
      }
    ]
  },
  {
    "name": "Advanced Messaging Funnel",
    "description": "Refine messaging and positioning to target segmented audiences more effectively.",
    "priority": 4,
    "level": 3,
    "dependencies": ["Positioning Funnel (TINB + Positioning Factors)"],
    "entryCriteria": {
      "mswScore": null,
      "reportedChallenges": ["Messaging misalignment"]
    },
    "responsibleAgents": {
      "lead": "Claire (LinkedIn Messaging Maestro)",
      "supporting": ["Lisa (Instagram Marketing Maestro)", "Gabriel (Blog Blueprint)"]
    },
    "formsNeeded": ["Messaging Alignment Worksheet"],
    "milestones": [
      {
        "name": "Develop Segmented Messaging",
        "description": "Create messaging for 2–3 audience segments based on personas.",
        "dataSource": "conversationId",
        "dataPath": "userData.segmentedMessaging",
        "validationLogic": "Ensure segmentedMessaging includes audience-specific details.",
        "conversationId": "segmentedMessagingConversation",
        "projectName": "Segmented Messaging Development",
        "priority": 1,
        "kpis": ["Messaging alignment score"]
      },
      {
        "name": "Launch Segmented Campaigns",
        "description": "Run targeted campaigns using the developed messaging.",
        "dataSource": "conversationId",
        "dataPath": "userData.segmentedCampaigns",
        "validationLogic": "Check if segmentedCampaigns includes results.",
        "conversationId": "segmentedCampaignsConversation",
        "projectName": "Segmented Campaigns Launch",
        "priority": 2,
        "kpis": ["Engagement growth by platform"]
      }
    ]
  },
  {
    "name": "Social Media Growth Funnel",
    "description": "Scale social media efforts to increase reach, engagement, and lead conversions.",
    "priority": 4,
    "level": 3,
    "dependencies": ["Awareness Funnel"],
    "entryCriteria": {
      "mswScore": null,
      "reportedChallenges": ["Low social media reach"]
    },
    "responsibleAgents": {
      "lead": "Deborah (Facebook Marketing Maestro)",
      "supporting": ["EJ (TikTok Marketing Maestro)", "Lisa (Instagram Marketing Maestro)"]
    },
    "formsNeeded": ["Social Media Growth Audit Form"],
    "milestones": [
      {
        "name": "Optimize Social Content",
        "description": "Optimize content for 3 social platforms to increase engagement.",
        "dataSource": "conversationId",
        "dataPath": "userData.socialContent",
        "validationLogic": "Ensure socialContent includes platform-specific strategies.",
        "conversationId": "socialContentConversation",
        "projectName": "Social Content Optimization",
        "priority": 1,
        "kpis": ["Follower growth by platform"]
      },
      {
        "name": "Launch Viral Campaigns",
        "description": "Design and execute viral content strategies targeting key audiences.",
        "dataSource": "conversationId",
        "dataPath": "userData.viralCampaigns",
        "validationLogic": "Check if viralCampaigns includes performance results.",
        "conversationId": "viralCampaignsConversation",
        "projectName": "Viral Campaign Execution",
        "priority": 2,
        "kpis": ["Engagement rates (likes, shares)"]
      }
    ]
  },
  {
    "name": "Reputation Management Funnel",
    "description": "Build and maintain a strong online reputation through reviews, testimonials, and PR strategies.",
    "priority": 5,
    "level": 4,
    "dependencies": ["WOW Funnel"],
    "entryCriteria": {
      "mswScore": null,
      "reportedChallenges": ["Negative reviews", "Low testimonials"]
    },
    "responsibleAgents": {
      "lead": "Daniela (Reputation Builder AI)",
      "supporting": ["Caner (InsightPulse AI)", "Sylvester (MSW Optimizer)"]
    },
    "formsNeeded": ["Reputation Audit Form"],
    "milestones": [
      {
        "name": "Collect Testimonials",
        "description": "Develop a testimonial collection strategy to improve social proof.",
        "dataSource": "conversationId",
        "dataPath": "userData.testimonialStrategy",
        "validationLogic": "Ensure testimonialStrategy includes actionable plans.",
        "conversationId": "testimonialStrategyConversation",
        "projectName": "Testimonial Strategy Development",
        "priority": 1,
        "kpis": ["Testimonial volume increase"]
      },
      {
        "name": "Handle Negative Feedback",
        "description": "Implement a plan to address and mitigate negative feedback online.",
        "dataSource": "conversationId",
        "dataPath": "userData.feedbackPlan",
        "validationLogic": "Ensure feedbackPlan includes response strategies.",
        "conversationId": "feedbackPlanConversation",
        "projectName": "Feedback Management",
        "priority": 2,
        "kpis": ["Sentiment analysis score"]
      }
    ]
  }
]
;

export default funnels;