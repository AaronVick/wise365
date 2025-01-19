// data/marketing-success-wheel.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const gradeOptions = [
  {
    value: 'A',
    label: 'Rockstar status! You\'re crushing it!',
    description: 'Exceptional performance'
  },
  {
    value: 'B',
    label: 'Nice! You\'re above average and doing well.',
    description: 'Above average performance'
  },
  {
    value: 'C',
    label: 'You\'re average, hanging in there with the pack.',
    description: 'Average performance'
  },
  {
    value: 'D',
    label: 'Below average. Not quite there yet, but there's potential!',
    description: 'Below average performance'
  },
  {
    value: 'F',
    label: 'Ouch! Looks like there's some room for improvement.',
    description: 'Needs significant improvement'
  }
]

const marketingSuccessWheel = {
  name: 'Marketing Success Wheel',
  type: 'form',
  structure: {
    fields: [
      {
        id: 'company_url',
        name: 'company_url',
        type: 'url',
        label: 'Company URL',
        required: true
      },
      {
        id: 'awareness',
        name: 'awareness',
        type: 'grade',
        label: 'Awareness Grade',
        description: 'The ability to make potential customers aware of your brand, products, or services.',
        options: gradeOptions,
        required: true
      },
      {
        id: 'engagement',
        name: 'engagement',
        type: 'grade',
        label: 'Engagement Grade',
        description: 'The level of interaction and involvement your audience has with your content or brand.',
        options: gradeOptions,
        required: true
      },
      {
        id: 'lead_generation',
        name: 'lead_generation',
        type: 'grade',
        label: 'Lead Generation Grade',
        description: 'The process of attracting and capturing potential customers\' interest to build a sales pipeline.',
        options: gradeOptions,
        required: true
      },
      {
        id: 'conversion_optimization',
        name: 'conversion_optimization',
        type: 'grade',
        label: 'Conversion Optimization Grade',
        description: 'Improving the effectiveness of marketing efforts to turn leads into customers.',
        options: gradeOptions,
        required: true
      },
      {
        id: 'wow',
        name: 'wow',
        type: 'grade',
        label: 'WOW Grade',
        description: 'Exceeding customer expectations and creating memorable experiences post-purchase.',
        options: gradeOptions,
        required: true
      },
      {
        id: 'customer_ladder',
        name: 'customer_ladder',
        type: 'grade',
        label: 'Customer Ladder Grade',
        description: 'Strategies to enhance customer loyalty by encouraging existing customers to make more purchases and try additional products or services.',
        options: gradeOptions,
        required: true
      },
      {
        id: 'reviews_testimonials',
        name: 'reviews_testimonials',
        type: 'grade',
        label: 'Reviews & Testimonials Grade',
        description: 'The strategy for encouraging and managing customer reviews and testimonials.',
        options: gradeOptions,
        required: true
      },
      {
        id: 'referrals',
        name: 'referrals',
        type: 'grade',
        label: 'Referrals Grade',
        description: 'Encouraging satisfied customers to refer new customers to your business.',
        options: gradeOptions,
        required: true
      }
    ],
    metadata: {
      version: '1.0.0',
      category: 'marketing',
      displayName: 'Marketing Success Wheel Assessment'
    }
  },
  validation_rules: {
    required_fields: [
      'company_url',
      'awareness',
      'engagement',
      'lead_generation',
      'conversion_optimization',
      'wow',
      'customer_ladder',
      'reviews_testimonials',
      'referrals'
    ]
  },
  required_for_funnels: ['marketing_assessment', 'business_growth'],
  version: '1.0.0'
}

async function seed() {
  try {
    const result = await prisma.resource.create({
      data: marketingSuccessWheel
    })
    console.log('Successfully seeded Marketing Success Wheel form:', result.id)
  } catch (error) {
    console.error('Error seeding Marketing Success Wheel form:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seed()