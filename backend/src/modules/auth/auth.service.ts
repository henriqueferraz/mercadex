import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authRepository } from './auth.repository';
import type { RegisterInput, LoginInput } from './auth.dto';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export const authService = {
    async register(input: RegisterInput) {
        const existing = await authRepository.findByEmail(input.email);
        if (existing) throw new Error('EMAIL_ALREADY_EXISTS');

        const passwordHash = await bcrypt.hash(input.password, 12);
        const user = await authRepository.create({
            name: input.name,
            email: input.email,
            passwordHash,
        });

        return { id: user.id, name: user.name, email: user.email, role: user.role };
    },

    async login(input: LoginInput) {
        const user = await authRepository.findByEmail(input.email);
        if (!user) throw new Error('INVALID_CREDENTIALS');

        const valid = await bcrypt.compare(input.password, user.passwordHash);
        if (!valid) throw new Error('INVALID_CREDENTIALS');

        const accessToken = jwt.sign(
            { sub: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { sub: user.id },
            JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        return {
            accessToken,
            refreshToken,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        };
    },

    async refresh(refreshToken: string) {
        const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { sub: string };
        const user = await authRepository.findById(payload.sub);
        if (!user) throw new Error('USER_NOT_FOUND');

        const accessToken = jwt.sign(
            { sub: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '15m' }
        );

        return { accessToken };
    },
};
