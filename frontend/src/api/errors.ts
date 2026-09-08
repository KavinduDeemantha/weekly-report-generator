import { AxiosError } from 'axios';

type BackendErrorBody = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly details?: string[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function defaultMessageForStatus(status?: number) {
  switch (status) {
    case 400:
      return 'Please check the information and try again.';
    case 401:
      return 'Please sign in to continue.';
    case 403:
      return 'You are not allowed to access this page.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'This conflicts with existing information.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

function cleanBackendMessage(message: string | string[] | undefined) {
  if (Array.isArray(message)) {
    return {
      message: message[0] ?? 'Please check the information and try again.',
      details: message,
    };
  }

  return {
    message,
    details: undefined,
  };
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const body = error.response?.data as BackendErrorBody | undefined;
    const cleaned = cleanBackendMessage(body?.message);

    return new ApiError(
      cleaned.message ?? defaultMessageForStatus(status),
      status,
      cleaned.details,
    );
  }

  return new ApiError(defaultMessageForStatus());
}

export function getErrorMessage(error: unknown) {
  return normalizeApiError(error).message;
}
