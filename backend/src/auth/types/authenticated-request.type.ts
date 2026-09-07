import { Request } from 'express';
import { AuthenticatedUser } from './authenticated-user.type.js';

export type AuthenticatedRequest = Request & {
  cookies?: Record<string, string | undefined>;
  user?: AuthenticatedUser;
};
