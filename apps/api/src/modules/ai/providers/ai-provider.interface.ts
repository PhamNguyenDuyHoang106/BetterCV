import { Response } from 'express';

export type PromptPayload = {
  system: string;
  user: string;
  input: unknown;
};

export type AiResponseEnvelope = {
  output: any;
  tokens: number;
};

export interface AiProvider {
  /**
   * Generates a structured response based on the system and user instructions.
   */
  generate(
    payload: PromptPayload,
    temperature?: number,
  ): Promise<AiResponseEnvelope>;

  /**
   * Streams a response directly into the Express HTTP response for live UX updates.
   */
  stream(
    payload: PromptPayload,
    res: Response,
    temperature?: number,
  ): Promise<{ text: string; tokens: number }>;

  /**
   * Performs vision-based OCR extraction from an image buffer.
   */
  visionOCR(
    imageBuffer: Buffer,
    systemPrompt: string,
    userPrompt: string,
  ): Promise<AiResponseEnvelope>;
}
