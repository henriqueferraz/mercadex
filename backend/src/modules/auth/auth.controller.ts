import type { Request, Response } from 'express';
import { authService } from './auth.service';
import { RegisterDto, LoginDto } from './auth.dto';

export const authController = {
    async register(req: Request, res: Response) {
        const parsed = RegisterDto.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
            });
            return;
        }
        try {
            const user = await authService.register(parsed.data);
            res.status(201).json({ success: true, data: user });
        } catch (err: unknown) {
            if (err instanceof Error && err.message === 'EMAIL_ALREADY_EXISTS') {
                res.status(409).json({ success: false, error: { code: 'EMAIL_ALREADY_EXISTS' } });
                return;
            }
            res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
        }
    },

    async login(req: Request, res: Response) {
        const parsed = LoginDto.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR' } });
            return;
        }
        try {
            const result = await authService.login(parsed.data);
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            res.json({ success: true, data: { accessToken: result.accessToken, user: result.user } });
        } catch (err: unknown) {
            if (err instanceof Error && err.message === 'INVALID_CREDENTIALS') {
                res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS' } });
                return;
            }
            res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
        }
    },

    async refresh(req: Request, res: Response) {
        const token = req.cookies?.refreshToken as string | undefined;
        if (!token) {
            res.status(401).json({ success: false, error: { code: 'NO_REFRESH_TOKEN' } });
            return;
        }
        try {
            const result = await authService.refresh(token);
            res.json({ success: true, data: result });
        } catch {
            res.status(401).json({ success: false, error: { code: 'REFRESH_TOKEN_INVALID' } });
        }
    },

    async logout(_req: Request, res: Response) {
        res.clearCookie('refreshToken');
        res.json({ success: true, data: { message: 'Logout realizado' } });
    },
};
