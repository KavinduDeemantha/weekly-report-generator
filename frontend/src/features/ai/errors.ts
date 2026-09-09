import { normalizeApiError } from '../../api/errors';

const aiMessages: Record<string, string> = {
  AI_RATE_LIMITED: 'AI request limit reached. Try again shortly.',
  AI_TIMEOUT: 'The AI response took too long. Please try again.',
  AI_UNAVAILABLE: 'AI service is temporarily unavailable. Please try again.',
  AI_INVALID_RESPONSE: 'The AI returned an invalid response. Please try again.',
  AI_CONFIGURATION_ERROR: 'AI Assistant is not configured correctly.',
  AI_UNKNOWN_PROVIDER_ERROR: 'AI Assistant is temporarily unavailable.',
};

const retryableCodes = new Set([
  'AI_RATE_LIMITED',
  'AI_TIMEOUT',
  'AI_UNAVAILABLE',
  'AI_INVALID_RESPONSE',
  'AI_UNKNOWN_PROVIDER_ERROR',
]);

export function getAiErrorMessage(error: unknown) {
  const normalizedError = normalizeApiError(error);

  return normalizedError.code
    ? aiMessages[normalizedError.code] ?? normalizedError.message
    : normalizedError.message;
}

export function canRetryAiError(error: unknown) {
  const normalizedError = normalizeApiError(error);

  if (normalizedError.statusCode === 400 || normalizedError.statusCode === 401) {
    return false;
  }

  return normalizedError.code
    ? retryableCodes.has(normalizedError.code)
    : normalizedError.statusCode !== 403;
}
