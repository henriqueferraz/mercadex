import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { LoginInput, RegisterInput } from './auth.dto';
import { authRepository } from './auth.repository';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? '15m') as SignOptions['expiresIn'];
const JWT_REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'];

function assertEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`MISSING_${name}`);
  }
  return value;
}

function publicUser(user: {
  id: string;
  name: string | null;
  email: string;
  role: string;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export const authService = {
  async register(input: RegisterInput) {
    const existing = await authRepository.findByEmail(input.email);
    if (existing) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await authRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });

    return publicUser(user);
  },

  async login(input: LoginInput) {
    const user = await authRepository.findByEmail(input.email);
    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const accessToken = jwt.sign(
      { sub: user.id, role: user.role },
      assertEnv(JWT_SECRET, 'JWT_SECRET') as jwt.Secret,
      { expiresIn: JWT_EXPIRES_IN },
    );

    const refreshToken = jwt.sign(
      { sub: user.id },
      assertEnv(JWT_REFRESH_SECRET, 'JWT_REFRESH_SECRET') as jwt.Secret,
      { expiresIn: JWT_REFRESH_EXPIRES_IN },
    );

    return {
      accessToken,
      refreshToken,
      user: publicUser(user),
    };
  },

  async refresh(refreshToken: string) {
    const payload = jwt.verify(
      refreshToken,
      assertEnv(JWT_REFRESH_SECRET, 'JWT_REFRESH_SECRET') as jwt.Secret,
    ) as { sub: string };

    const user = await authRepository.findById(payload.sub);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    const accessToken = jwt.sign(
      { sub: user.id, role: user.role },
      assertEnv(JWT_SECRET, 'JWT_SECRET') as jwt.Secret,
      { expiresIn: JWT_EXPIRES_IN },
    );

    return { accessToken };
  },
};
