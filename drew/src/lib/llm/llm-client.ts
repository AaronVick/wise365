// src/lib/llm/llm-client.ts
/**
 * LLM Client Wrapper
 * 
 * Provides a unified interface for interacting with different LLM providers.
 * Currently supports OpenAI and Anthropic.
 * 
 * Dependencies:
 * - openai: OpenAI API client
 * - @anthropic-ai/sdk: Anthropic API client
 */

import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

export class LLMClient {
  private openai: OpenAI
  private anthropic: Anthropic

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    })
  }

  async analyze(provider: string, model: string, prompt: string): Promise<any> {
    switch (provider.toLowerCase()) {
      case 'openai':
        return this.analyzeWithOpenAI(model, prompt)
      case 'anthropic':
        return this.analyzeWithAnthropic(model, prompt)
      default:
        throw new Error(`Unsupported LLM provider: ${provider}`)
    }
  }

  private async analyzeWithOpenAI(model: string, prompt: string): Promise<any> {
    const response = await this.openai.chat.completions.create({
      model,
      messages: [{
        role: 'system',
        content: 'You are a website analysis expert. Analyze the provided webpage content and provide structured insights.'
      }, {
        role: 'user',
        content: prompt
      }],
      response_format: { type: 'json_object' }
    })

    return JSON.parse(response.choices[0].message.content || '{}')
  }

  private async analyzeWithAnthropic(model: string, prompt: string): Promise<any> {
    const response = await this.anthropic.messages.create({
      model,
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    return JSON.parse(response.content[0].text)
  }
}