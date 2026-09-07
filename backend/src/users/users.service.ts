import { Injectable } from '@nestjs/common';
import { Role } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PaginatedUsers, SafeUser, UserWithPassword } from './users.types.js';

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
} as const;

const userWithPasswordSelect = {
  ...safeUserSelect,
  passwordHash: true,
  isActive: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  async findByEmail(email: string): Promise<UserWithPassword | null> {
    return this.prisma.user.findUnique({
      where: { email: this.normalizeEmail(email) },
      select: userWithPasswordSelect,
    });
  }

  async findById(id: string): Promise<SafeUser | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: safeUserSelect,
    });
  }

  async createTeamMember(input: {
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<SafeUser> {
    return this.prisma.user.create({
      data: {
        name: input.name.trim(),
        email: this.normalizeEmail(input.email),
        passwordHash: input.passwordHash,
        role: Role.TEAM_MEMBER,
      },
      select: safeUserSelect,
    });
  }

  async listUsers(page: number, limit: number): Promise<PaginatedUsers> {
    const normalizedPage = Math.max(1, page);
    const normalizedLimit = Math.min(Math.max(1, limit), 100);
    const skip = (normalizedPage - 1) * normalizedLimit;

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: normalizedLimit,
        select: safeUserSelect,
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users,
      meta: {
        page: normalizedPage,
        limit: normalizedLimit,
        total,
      },
    };
  }
}
