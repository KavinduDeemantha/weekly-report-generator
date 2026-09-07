import { Role } from '../../generated/prisma/enums.js';

export type AuthenticatedUser = {
  id: string;
  role: Role;
};

export type JwtAccessPayload = {
  sub: string;
  role: Role;
};
