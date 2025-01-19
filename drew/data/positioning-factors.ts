// data/positioning-factors.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const positioningFactorsForm = {
  name: 'Positioning Factors Worksheet',
  type: 'form',
  structure: {
    fields: [
      // Step 1: Strengths
      {
        id: 'strength_1',
        name: 'strength_1',
        type: 'text',
        label: 'Strength 1',
        description: 'What is your first key business strength that sets you apart?',
        required: true
      },
      {
        id: 'strength_2',
        name: 'strength_2',
        type: 'text',
        label: 'Strength 2',
        description: 'What is your second key business strength?',
        required: true
      },
      {
        id: 'strength_3',
        name: 'strength_3',
        type: 'text',
        label: 'Strength 3',
        description: 'What is your third key business strength?',
        required: true
      },
      
      // Step 2: Unique Attributes
      {
        id: 'unique_attribute_1',
        name: 'unique_attribute_1',
        type: 'text',
        label: 'Unique Attribute 1',
        description: 'What specific attribute makes your products/services different?',
        required: true
      },
      {
        id: 'unique_attribute_2',
        name: 'unique_attribute_2',
        type: 'text',
        label: 'Unique Attribute 2',
        description: 'What is another unique attribute of your offerings?',
        required: true
      },
      {
        id: 'unique_attribute_3',
        name: 'unique_attribute_3',
        type: 'text',
        label: 'Unique Attribute 3',
        description: 'What is a third unique attribute of your offerings?',
        required: true
      },

      // Step 3: Recognitions
      {
        id: 'recognition_1',
        name: 'recognition_1',
        type: 'text',
        label: 'Award/Recognition 1',
        description: 'What is a key award or recognition your business has received?',
        required: true
      },
      {
        id: 'recognition_2',
        name: 'recognition_2',
        type: 'text',
        label: 'Award/Recognition 2',
        description: 'What is another significant award or recognition?',
        required: true
      },
      {
        id: 'recognition_3',
        name: 'recognition_3',
        type: 'text',
        label: 'Award/Recognition 3',
        description: 'What is a third notable award or recognition?',
        required: true
      },

      // Step 4: Guarantees
      {
        id: 'guarantee_1',
        name: 'guarantee_1',
        type: 'text',
        label: 'Guarantee/Warranty 1',
        description: 'What is your primary guarantee or warranty offering?',
        required: true
      },
      {
        id: 'guarantee_2',
        name: 'guarantee_2',
        type: 'text',
        label: 'Guarantee/Warranty 2',
        description: 'What is another guarantee or warranty you offer?',
        required: true
      },
      {
        id: 'guarantee_3',
        name: 'guarantee_3',
        type: 'text',
        label: 'Guarantee/Warranty 3',
        description: 'What is a third guarantee or warranty you provide?',
        required: true
      },

      // Step 5: Market Focus
      {
        id: 'market_focus_1',
        name: 'market_focus_1',
        type: 'text',
        label: 'Industry/Market Focus 1',
        description: 'What is your primary market or industry specialization?',
        required: true
      },
      {
        id: 'market_focus_2',
        name: 'market_focus_2',
        type: 'text',
        label: 'Industry/Market Focus 2',
        description: 'What is another key market or industry you serve?',
        required: true
      },
      {
        id: 'market_focus_3',
        name: 'market_focus_3',
        type: 'text',
        label: 'Industry/Market Focus 3',
        description: 'What is a third important market or industry focus?',
        required: true
      },

      // Step 6: Success Stories
      {
        id: 'success_story_1',
        name: 'success_story_1',
        type: 'text',
        label: 'Testimonial/Case Study 1',
        description: 'Share a key customer success story or testimonial',
        required: true
      },
      {
        id: 'success_story_2',
        name: 'success_story_2',
        type: 'text',
        label: 'Testimonial/Case Study 2',
        description: 'Share another significant customer success story',
        required: true
      },
      {
        id: 'success_story_3',
        name: 'success_story_3',
        type: 'text',
        label: 'Testimonial/Case Study 3',
        description: 'Share a third notable customer success story',
        required: true
      }
    ],
    sections: [
      {
        id: 'strengths',
        title: 'Step 1: Reflect on Your Strengths',
        description: 'What are the top three strengths that your business has that set it apart from your competitors?',
        fields: ['strength_1', 'strength_2', 'strength_3']
      },
      {
        id: 'unique_attributes',
        title: 'Step 2: Identify Unique Attributes',
        description: 'What specific attributes or qualities of your products or services make them different from others in the market?',
        fields: ['unique_attribute_1', 'unique_attribute_2', 'unique_attribute_3']
      },
      {
        id: 'recognitions',
        title: 'Step 3: Highlight Recognitions and Achievements',
        description: 'List any awards, certifications, or industry recognitions your business has received. Why are these important to your customers?',
        fields: ['recognition_1', 'recognition_2', 'recognition_3']
      },
      {
        id: 'guarantees',
        title: 'Step 4: Focus on Guarantees and Warranties',
        description: 'Do you offer any guarantees or warranties that demonstrate your confidence in your products or services?',
        fields: ['guarantee_1', 'guarantee_2', 'guarantee_3']
      },
      {
        id: 'market_focus',
        title: 'Step 5: Define Your Market and Industry Focus',
        description: 'Which specific markets or industries does your business specialize in? What expertise do you have in these areas?',
        fields: ['market_focus_1', 'market_focus_2', 'market_focus_3']
      },
      {
        id: 'success_stories',
        title: 'Step 6: Highlight Customer Success Stories',
        description: 'Do you have any customer testimonials or case studies that illustrate the unique value you provide? How do these examples demonstrate your positioning factors?',
        fields: ['success_story_1', 'success_story_2', 'success_story_3']
      }
    ],
    metadata: {
      version: '1.0.0',
      category: 'business_strategy',
      displayName: 'Positioning Factors Worksheet',
      description: 'Identify and articulate the elements that set your business apart from the competition.'
    }
  },
  validation_rules: {
    required_fields: [
      'strength_1', 'strength_2', 'strength_3',
      'unique_attribute_1', 'unique_attribute_2', 'unique_attribute_3',
      'recognition_1', 'recognition_2', 'recognition_3',
      'guarantee_1', 'guarantee_2', 'guarantee_3',
      'market_focus_1', 'market_focus_2', 'market_focus_3',
      'success_story_1', 'success_story_2', 'success_story_3'
    ]
  },
  required_for_funnels: ['business_strategy', 'marketing_plan'],
  version: '1.0.0'
}

async function seed() {
  try {
    const result = await prisma.resource.create({
      data: positioningFactorsForm
    })
    console.log('Successfully seeded Positioning Factors form:', result.id)
  } catch (error) {
    console.error('Error seeding Positioning Factors form:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seed()