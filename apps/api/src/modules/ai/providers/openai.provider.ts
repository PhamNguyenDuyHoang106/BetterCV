import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import {
  AiProvider,
  PromptPayload,
  AiResponseEnvelope,
} from './ai-provider.interface';

@Injectable()
export class OpenAiProvider implements AiProvider {
  private readonly logger = new Logger(OpenAiProvider.name);

  constructor(private config: ConfigService) {}

  async generate(
    payload: PromptPayload,
    temperature = 0.4,
    forceJsonOutput = false,
  ): Promise<AiResponseEnvelope> {
    const { baseUrl, apiKey } = this.getAiConfig();
    const body = this.buildChatBody(payload, false, temperature, forceJsonOutput);

    const result = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!result.ok) {
      this.logger.error(`OpenAI Request Failed: Status ${result.status}`);
      throw new ForbiddenException('AI provider request failed');
    }

    const json = (await result.json()) as any;
    const content = json.choices?.[0]?.message?.content ?? '{}';
    const tokens = json.usage?.total_tokens ?? 0;

    return { output: this.safeJsonParse(content), tokens };
  }

  async stream(
    payload: PromptPayload,
    res: Response,
    temperature = 0.4,
  ): Promise<{ text: string; tokens: number }> {
    const { baseUrl, apiKey } = this.getAiConfig();
    const body = this.buildChatBody(payload, true, temperature);

    const result = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!result.ok || !result.body) {
      this.logger.error(
        `OpenAI Stream Request Failed: Status ${result.status}`,
      );
      throw new ForbiddenException('AI provider streaming request failed');
    }

    const reader = result.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    let totalTokens = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content ?? '';
          if (delta) {
            fullText += delta;
            res.write(`data: ${JSON.stringify({ text: delta })}\n\n`);
          }
          if (parsed.usage?.total_tokens) {
            totalTokens = parsed.usage.total_tokens;
          }
        } catch {
          continue;
        }
      }
    }

    return { text: fullText, tokens: totalTokens || 0 };
  }

  async visionOCR(
    imageBuffer: Buffer,
    systemPrompt: string,
    userPrompt: string,
  ): Promise<AiResponseEnvelope> {
    const { baseUrl, apiKey } = this.getAiConfig();
    const base64Image = imageBuffer.toString('base64');
    const model = this.config.get<string>('OPENAI_MODEL', 'gpt-4o-mini');

    const body = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      temperature: 0.0,
      response_format: { type: 'json_object' },
    };

    const result = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!result.ok) {
      this.logger.error(
        `OpenAI Vision Request Failed: Status ${result.status}`,
      );
      throw new ForbiddenException('AI provider vision request failed');
    }

    const json = (await result.json()) as any;
    const content = json.choices?.[0]?.message?.content ?? '{}';
    const tokens = json.usage?.total_tokens ?? 0;

    return { output: this.safeJsonParse(content), tokens };
  }

  private getAiConfig() {
    const baseUrl = this.config.get<string>('OPENAI_BASE_URL');
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!baseUrl || !apiKey) {
      throw new ForbiddenException('AI provider configuration missing');
    }
    return { baseUrl, apiKey };
  }

  private buildChatBody(
    payload: PromptPayload,
    stream: boolean,
    temperature: number,
    forceJsonOutput = false,
  ) {
    return {
      model: this.config.get<string>('OPENAI_MODEL', 'gpt-4o-mini'),
      messages: [
        { role: 'system', content: payload.system },
        {
          role: 'user',
          content: `${payload.user}\n\nINPUT:\n${JSON.stringify(payload.input)}`,
        },
      ],
      temperature,
      ...(forceJsonOutput ? { response_format: { type: 'json_object' } } : {}),
      ...(stream
        ? { stream: true, stream_options: { include_usage: true } }
        : {}),
    };
  }

  private safeJsonParse(value: string): Record<string, unknown> {
    try {
      return JSON.parse(value);
    } catch {
      return { raw: value };
    }
  }
}
