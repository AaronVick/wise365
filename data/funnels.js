// Full JSON data for seeding
const funnels = 
[
    {
        "name": "Onboarding Funnel",
        "description": "Collect foundational business data, validate user objectives, and guide them into relevant funnels.",
        "priority": 1,
        "level": 1,
        "dependencies": [],
        "entryCriteria": {
            "mswScore": null,
            "reportedChallenges": []
        },
        "responsibleAgents": {
            "lead": "Shawn (Tool Guidance Assistant)",
            "supporting": [
                "Caner (InsightPulse AI)",
                "Ally (Positioning Factors Accelerator)"
            ]
        },
        "formsNeeded": [
            "Marketing Success Wheel"
        ],
        "milestones": [
            {
                "name": "Collect Basic Info",
                "description": "Gather essential business data like name, website, and goals.",
                "dataSource": "conversationId",
                "dataPath": "userData.basicInfo",
                "validationLogic": "Check if basicInfo includes name, website, and goals.",
                "conversationId": "basicInfoConversation",
                "projectName": "Basic Information Collection",
                "priority": 1,
                "kpis": [
                    "% of users completing onboarding"
                ]
            },
            {
                "name": "Validate Website Findings",
                "description": "Analyze website insights and validate with the user.",
                "dataSource": "conversationId",
                "dataPath": "userData.websiteInsights",
                "validationLogic": "Ensure websiteInsights includes validated data.",
                "conversationId": "websiteInsightsConversation",
                "projectName": "Website Analysis Validation",
                "priority": 2,
                "kpis": [
                    "Accuracy of funnel recommendations"
                ]
            }
        ]
    },
    {
        "name": "Customer Ladder Funnel",
        "description": "Move customers from buyers to advocates.",
        "priority": 3,
        "level": 3,
        "dependencies": [
            "Lead Generation Funnel"
        ],
        "entryCriteria": {
            "mswScore": "1-3",
            "reportedChallenges": [
                "Retention challenges"
            ]
        },
        "responsibleAgents": {
            "lead": "Troy (CrossSell Catalyst)",
            "supporting": [
                "Sylvester (MSW Optimizer)",
                "Aaron (TINB Builder)"
            ]
        },
        "formsNeeded": [
            "Marketing Success Wheel"
        ],
        "milestones": [
            {
                "name": "Identify Customer Segments",
                "description": "Focus on key segments for upselling and cross-selling.",
                "dataSource": "conversationId",
                "dataPath": "userData.customerSegments",
                "validationLogic": "Check if customerSegments includes segment definitions.",
                "conversationId": "customerSegmentsConversation",
                "projectName": "Customer Segment Identification",
                "priority": 2,
                "kpis": [
                    "Upsell opportunities"
                ]
            },
            {
                "name": "Develop Loyalty Initiatives",
                "description": "Launch loyalty programs or cross-sell campaigns.",
                "dataSource": "conversationId",
                "dataPath": "userData.loyaltyInitiatives",
                "validationLogic": "Ensure loyaltyInitiatives includes program details.",
                "conversationId": "loyaltyInitiativesConversation",
                "projectName": "Loyalty Initiative Development",
                "priority": 3,
                "kpis": [
                    "Repeat purchases"
                ]
            }
        ]
    },
    {
        "name": "Awareness Funnel",
        "description": "Increase visibility and attract a broader audience.",
        "priority": 2,
        "level": 2,
        "dependencies": [
            "Onboarding Funnel"
        ],
        "entryCriteria": {
            "mswScore": "1-3",
            "reportedChallenges": [
                "Low visibility"
            ]
        },
        "responsibleAgents": {
            "lead": "Mike (Marketing Strategist)",
            "supporting": [
                "Gabriel (Blog Blueprint)",
                "Lisa (Instagram Marketing Maestro)"
            ]
        },
        "formsNeeded": [
            "Marketing Success Wheel"
        ],
        "milestones": [
            {
                "name": "Analyze Visibility",
                "description": "Assess current visibility efforts and identify gaps.",
                "dataSource": "conversationId",
                "dataPath": "userData.visibilityAnalysis",
                "validationLogic": "Check if visibilityAnalysis includes detailed gaps.",
                "conversationId": "visibilityAnalysisConversation",
                "projectName": "Visibility Analysis",
                "priority": 2,
                "kpis": [
                    "Website traffic growth"
                ]
            },
            {
                "name": "Develop Multi-Channel Strategy",
                "description": "Create a strategy for visibility improvement across platforms.",
                "dataSource": "conversationId",
                "dataPath": "userData.multiChannelStrategy",
                "validationLogic": "Ensure multiChannelStrategy outlines steps for improvement.",
                "conversationId": "multiChannelStrategyConversation",
                "projectName": "Multi-Channel Strategy Development",
                "priority": 3,
                "kpis": [
                    "Campaign impressions",
                    "Brand mentions"
                ]
            }
        ]
    },
    {
        "name": "Lead Generation Funnel",
        "description": "Build a pipeline of qualified leads.",
        "priority": 3,
        "level": 3,
        "dependencies": [
            "Awareness Funnel"
        ],
        "entryCriteria": {
            "mswScore": "1-3",
            "reportedChallenges": [
                "Low lead volume"
            ]
        },
        "responsibleAgents": {
            "lead": "Orion (Lead Magnet Maker)",
            "supporting": [
                "Gabriel (Blog Blueprint)",
                "Ally (Positioning Factors Accelerator)"
            ]
        },
        "formsNeeded": [
            "Marketing Success Wheel"
        ],
        "milestones": [
            {
                "name": "Develop Lead Magnet",
                "description": "Create high-value lead magnets for potential customers.",
                "dataSource": "conversationId",
                "dataPath": "userData.leadMagnets",
                "validationLogic": "Ensure leadMagnets includes at least 1 resource.",
                "conversationId": "leadMagnetConversation",
                "projectName": "Lead Magnet Development",
                "priority": 2,
                "kpis": [
                    "Total leads generated"
                ]
            },
            {
                "name": "Optimize Landing Pages",
                "description": "Enhance landing pages to increase conversions.",
                "dataSource": "conversationId",
                "dataPath": "userData.landingPageOptimization",
                "validationLogic": "Check if landingPageOptimization includes actionable updates.",
                "conversationId": "landingPageConversation",
                "projectName": "Landing Page Optimization",
                "priority": 3,
                "kpis": [
                    "Lead-to-conversion ratios"
                ]
            }
        ]
    },
    {
        "name": "Engagement Funnel",
        "description": "Strengthen interactions between the business and its audience.",
        "priority": 4,
        "level": 3,
        "dependencies": [
            "Awareness Funnel"
        ],
        "entryCriteria": {
            "mswScore": "1-3",
            "reportedChallenges": [
                "Low engagement metrics"
            ]
        },
        "responsibleAgents": {
            "lead": "Sylvester (MSW Optimizer)",
            "supporting": [
                "Jesse (Email Marketing Maestro)",
                "Lisa (Instagram Marketing Maestro)"
            ]
        },
        "formsNeeded": [
            "Marketing Success Wheel"
        ],
        "milestones": [
            {
                "name": "Launch Interactive Content",
                "description": "Create and deploy interactive content like quizzes or polls.",
                "dataSource": "conversationId",
                "dataPath": "userData.interactiveContent",
                "validationLogic": "Check if interactiveContent includes deployment details.",
                "conversationId": "interactiveContentConversation",
                "projectName": "Interactive Content Launch",
                "priority": 2,
                "kpis": [
                    "Engagement rates",
                    "Time spent on site"
                ]
            },
            {
                "name": "Improve Email Open Rates",
                "description": "Enhance email content to increase open and click-through rates.",
                "dataSource": "conversationId",
                "dataPath": "userData.emailCampaigns",
                "validationLogic": "Ensure emailCampaigns includes updated messaging.",
                "conversationId": "emailCampaignsConversation",
                "projectName": "Email Campaign Optimization",
                "priority": 3,
                "kpis": [
                    "Email open rates",
                    "Click-through rates"
                ]
            }
        ]
    },
    {
        "name": "Retention & Referrals Funnel",
        "description": "Turn satisfied customers into advocates.",
        "priority": 4,
        "level": 4,
        "dependencies": [
            "Customer Ladder Funnel"
        ],
        "entryCriteria": {
            "mswScore": "1-3",
            "reportedChallenges": [
                "Low retention or referral rates"
            ]
        },
        "responsibleAgents": {
            "lead": "Daniela (Reputation Builder AI)",
            "supporting": [
                "Troy (CrossSell Catalyst)",
                "Jesse (Email Marketing Maestro)"
            ]
        },
        "formsNeeded": [
            "Marketing Success Wheel"
        ],
        "milestones": [
            {
                "name": "Launch Referral Program",
                "description": "Design and implement a referral program.",
                "dataSource": "conversationId",
                "dataPath": "userData.referralProgram",
                "validationLogic": "Ensure referralProgram includes incentive structures.",
                "conversationId": "referralProgramConversation",
                "projectName": "Referral Program Launch",
                "priority": 2,
                "kpis": [
                    "Referral conversions"
                ]
            },
            {
                "name": "Gather Testimonials",
                "description": "Collect high-quality testimonials from satisfied customers.",
                "dataSource": "conversationId",
                "dataPath": "userData.testimonials",
                "validationLogic": "Check if testimonials includes 10+ entries.",
                "conversationId": "testimonialsConversation",
                "projectName": "Testimonial Collection",
                "priority": 3,
                "kpis": [
                    "Testimonial volume"
                ]
            }
        ]
    }
];

export default funnels;