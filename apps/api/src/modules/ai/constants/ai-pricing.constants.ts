import { AiProvider } from '@prisma/client';

export const MODEL_PRICING: Record<
  string,
  { provider: AiProvider; inputUsdPer1M: number; outputUsdPer1M: number }
> = {
  'gpt-4o-mini': {
    provider: AiProvider.OPENAI,
    inputUsdPer1M: 0.15,
    outputUsdPer1M: 0.6,
  },
  'gpt-4o': {
    provider: AiProvider.OPENAI,
    inputUsdPer1M: 5.0,
    outputUsdPer1M: 15.0,
  },
};

export const DEFAULT_PRICING = {
  provider: AiProvider.OPENAI,
  inputUsdPer1M: 0.15,
  outputUsdPer1M: 0.6,
};
