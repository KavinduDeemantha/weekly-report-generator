import {
  BadGatewayException,
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';

export enum AiErrorCategory {
  RATE_LIMIT = 'RATE_LIMIT',
  TIMEOUT = 'TIMEOUT',
  PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE',
  INVALID_REQUEST = 'INVALID_REQUEST',
  MODEL_UNAVAILABLE = 'MODEL_UNAVAILABLE',
  INVALID_MODEL_RESPONSE = 'INVALID_MODEL_RESPONSE',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  UNKNOWN_PROVIDER_ERROR = 'UNKNOWN_PROVIDER_ERROR',
}

export type ClassifiedAiError = {
  category: AiErrorCategory;
  providerStatus?: number;
  providerCode?: string;
  retryAfterSeconds?: number;
  providerMessageHint?: string;
};

export function classifyAiError(error: unknown): ClassifiedAiError {
  if (error instanceof HttpException) {
    const response = error.getResponse();
    const code =
      typeof response === 'object' && response !== null
        ? String((response as { code?: unknown }).code ?? '')
        : '';

    if (code === 'AI_TIMEOUT') {
      return { category: AiErrorCategory.TIMEOUT };
    }

    if (code === 'AI_CONFIGURATION_ERROR') {
      return { category: AiErrorCategory.CONFIGURATION_ERROR };
    }

    if (code === 'AI_INVALID_RESPONSE') {
      return { category: AiErrorCategory.INVALID_MODEL_RESPONSE };
    }
  }

  const providerStatus = extractStatus(error);
  const providerCode = extractCode(error);
  const retryAfterSeconds = extractRetryAfterSeconds(error);
  const providerMessageHint = extractMessageHint(error);

  if (
    providerStatus === 429 ||
    providerCode === 'RESOURCE_EXHAUSTED' ||
    providerCode === 'RATE_LIMIT_EXCEEDED' ||
    includesAny(providerMessageHint, ['429', 'quota', 'resource_exhausted'])
  ) {
    return {
      category: AiErrorCategory.RATE_LIMIT,
      providerStatus,
      providerCode,
      retryAfterSeconds,
      providerMessageHint,
    };
  }

  if (
    providerStatus === 404 ||
    providerCode === 'NOT_FOUND' ||
    providerCode === 'MODEL_NOT_FOUND' ||
    includesAny(providerMessageHint, ['404', 'not_found', 'not found'])
  ) {
    return {
      category: AiErrorCategory.MODEL_UNAVAILABLE,
      providerStatus,
      providerCode,
      providerMessageHint,
    };
  }

  if (
    providerStatus === 400 ||
    providerCode === 'INVALID_ARGUMENT' ||
    providerCode === 'FAILED_PRECONDITION' ||
    includesAny(providerMessageHint, ['invalid_argument', 'failed_precondition'])
  ) {
    return {
      category: AiErrorCategory.INVALID_REQUEST,
      providerStatus,
      providerCode,
      providerMessageHint,
    };
  }

  if (
    (providerStatus !== undefined && providerStatus >= 500) ||
    providerCode === 'UNAVAILABLE' ||
    providerCode === 'INTERNAL' ||
    includesAny(providerMessageHint, ['503', 'unavailable', 'internal error'])
  ) {
    return {
      category: AiErrorCategory.PROVIDER_UNAVAILABLE,
      providerStatus,
      providerCode,
      providerMessageHint,
    };
  }

  if (
    isNetworkReset(error) ||
    includesAny(providerMessageHint, [
      'fetch failed',
      'network',
      'econnreset',
      'etimedout',
      'eai_again',
    ])
  ) {
    return {
      category: AiErrorCategory.PROVIDER_UNAVAILABLE,
      providerStatus,
      providerCode,
      providerMessageHint,
    };
  }

  return {
    category: AiErrorCategory.UNKNOWN_PROVIDER_ERROR,
    providerStatus,
    providerCode,
    providerMessageHint,
  };
}

export function toAiHttpException(error: ClassifiedAiError): HttpException {
  switch (error.category) {
    case AiErrorCategory.RATE_LIMIT:
      return new HttpException(
        {
          message: 'AI request limit reached. Please try again shortly.',
          code: 'AI_RATE_LIMITED',
          retryAfterSeconds: error.retryAfterSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    case AiErrorCategory.TIMEOUT:
      return new ServiceUnavailableException({
        message: 'AI response took too long. Please try again.',
        code: 'AI_TIMEOUT',
      });
    case AiErrorCategory.PROVIDER_UNAVAILABLE:
      return new ServiceUnavailableException({
        message: 'AI service is temporarily unavailable. Please try again.',
        code: 'AI_UNAVAILABLE',
      });
    case AiErrorCategory.INVALID_REQUEST:
      return new BadGatewayException({
        message: 'AI provider rejected the request. Please try again.',
        code: 'AI_PROVIDER_INVALID_REQUEST',
      });
    case AiErrorCategory.MODEL_UNAVAILABLE:
      return new ServiceUnavailableException({
        message: 'Configured AI model is unavailable. Please check Gemini model settings.',
        code: 'AI_MODEL_UNAVAILABLE',
      });
    case AiErrorCategory.INVALID_MODEL_RESPONSE:
      return new BadGatewayException({
        message: 'AI returned an invalid response. Please try again.',
        code: 'AI_INVALID_RESPONSE',
      });
    case AiErrorCategory.CONFIGURATION_ERROR:
      return new ServiceUnavailableException({
        message: 'AI Assistant is not configured correctly.',
        code: 'AI_CONFIGURATION_ERROR',
      });
    case AiErrorCategory.UNKNOWN_PROVIDER_ERROR:
      return new ServiceUnavailableException({
        message: 'AI Assistant is temporarily unavailable.',
        code: 'AI_UNKNOWN_PROVIDER_ERROR',
      });
  }
}

export function isRetryableAiError(error: ClassifiedAiError): boolean {
  return error.category === AiErrorCategory.PROVIDER_UNAVAILABLE;
}

export function isModelUnavailableAiError(error: ClassifiedAiError): boolean {
  return error.category === AiErrorCategory.MODEL_UNAVAILABLE;
}

export function invalidModelResponseException(): HttpException {
  return toAiHttpException({
    category: AiErrorCategory.INVALID_MODEL_RESPONSE,
  });
}

export function configurationException(): HttpException {
  return toAiHttpException({
    category: AiErrorCategory.CONFIGURATION_ERROR,
  });
}

export function timeoutException(): HttpException {
  return toAiHttpException({
    category: AiErrorCategory.TIMEOUT,
  });
}

function extractStatus(error: unknown): number | undefined {
  const status = getNestedValue(error, ['status']) ?? getNestedValue(error, ['code']);
  const responseStatus =
    getNestedValue(error, ['response', 'status']) ??
    getNestedValue(error, ['error', 'status']);
  const numericStatus = Number(responseStatus ?? status);

  return Number.isInteger(numericStatus) ? numericStatus : undefined;
}

function extractCode(error: unknown): string | undefined {
  const code =
    getNestedValue(error, ['code']) ??
    getNestedValue(error, ['error', 'code']) ??
    getNestedValue(error, ['response', 'data', 'error', 'status']) ??
    getNestedValue(error, ['error', 'status']) ??
    getNestedValue(error, ['status']);

  return typeof code === 'string' ? code : undefined;
}

function extractRetryAfterSeconds(error: unknown): number | undefined {
  const retryAfter =
    getNestedValue(error, ['response', 'headers', 'retry-after']) ??
    getNestedValue(error, ['headers', 'retry-after']);
  const numericRetryAfter = Number(retryAfter);

  return Number.isFinite(numericRetryAfter) && numericRetryAfter > 0
    ? numericRetryAfter
    : undefined;
}

function extractMessageHint(error: unknown): string | undefined {
  const message =
    getNestedValue(error, ['message']) ??
    getNestedValue(error, ['error', 'message']) ??
    getNestedValue(error, ['response', 'data', 'error', 'message']);

  if (typeof message !== 'string') {
    return undefined;
  }

  return sanitizeMessageHint(message);
}

function sanitizeMessageHint(message: string): string | undefined {
  const normalized = message.replace(/\s+/g, ' ').trim();

  if (!normalized) {
    return undefined;
  }

  return normalized
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, '[redacted-api-key]')
    .slice(0, 180);
}

function includesAny(value: string | undefined, needles: string[]): boolean {
  const normalized = value?.toLowerCase();

  return normalized
    ? needles.some((needle) => normalized.includes(needle))
    : false;
}

function getNestedValue(error: unknown, path: string[]): unknown {
  let current = error;

  for (const segment of path) {
    if (typeof current !== 'object' || current === null) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

function isNetworkReset(error: unknown): boolean {
  const code = extractCode(error);
  return code === 'ECONNRESET' || code === 'ETIMEDOUT' || code === 'EAI_AGAIN';
}
