import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    user?: { id: string; role: string };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED' } });
        return;
    }

    try {
        const token = header.slice(7);
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string; role: string };
        req.user = { id: payload.sub, role: payload.role };
        next();
    } catch {
        res.status(401).json({ success: false, error: { code: 'TOKEN_INVALID' } });
    }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN' } });
        return;
    }
    next();
}
