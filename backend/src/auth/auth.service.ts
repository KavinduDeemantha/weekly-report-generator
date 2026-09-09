import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { Prisma } from '../generated/prisma/client.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtAccessPayload } from './types/authenticated-user.type.js';
import { SafeUser } from '../users/users.types.js';
import { UsersService } from '../users/users.service.js';

const BCRYPT_SALT_ROUNDS = 12;
const DEFAULT_ACCESS_TOKEN_EXPIRES_IN = '8h';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<SafeUser> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    try {
      return await this.usersService.createTeamMember({
        name: dto.name,
        email: dto.email,
        passwordHash,
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email is already registered');
      }

      throw error;
    }
  }

  async login(dto: LoginDto): Promise<{ user: SafeUser; accessToken: string }> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const safeUser: SafeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    const payload: JwtAccessPayload = {
      sub: user.id,
      role: user.role,
    };

    return {
      user: safeUser,
      accessToken: await this.jwtService.signAsync(payload, {
        secret: this.getJwtSecret(),
        expiresIn: Math.floor(this.getCookieMaxAgeMs() / 1000),
      }),
    };
  }

  async getCurrentUser(userId: string): Promise<SafeUser> {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Invalid authentication session');
    }

    return user;
  }

  getCookieMaxAgeMs(): number {
    return parseDurationMs(this.getAccessTokenExpiresIn());
  }

  getJwtSecret(): string {
    const secret = this.configService.get<string>('JWT_ACCESS_SECRET');

    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not defined');
    }

    return secret;
  }

  private getAccessTokenExpiresIn(): string {
    return (
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ??
      DEFAULT_ACCESS_TOKEN_EXPIRES_IN
    );
  }
}

export function parseDurationMs(value: string): number {
  const match = value.trim().match(/^(\d+)(ms|s|m|h|d)?$/);

  if (!match) {
    return 8 * 60 * 60 * 1000;
  }

  const amount = Number(match[1]);
  const unit = match[2] ?? 's';

  switch (unit) {
    case 'd':
      return amount * 24 * 60 * 60 * 1000;
    case 'h':
      return amount * 60 * 60 * 1000;
    case 'm':
      return amount * 60 * 1000;
    case 's':
      return amount * 1000;
    case 'ms':
    default:
      return amount;
  }
}
