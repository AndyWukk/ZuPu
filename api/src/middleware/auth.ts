import { Request, Response, NextFunction } from 'express';
import { JWTUtils } from '../utils/jwt';
import { AuthService } from '../services/authService';
import { User } from '../types/auth';

// 扩展Request接口
declare global {
  namespace Express {
    interface Request {
      user?: User;
      token?: string;
    }
  }
}

/**
 * JWT认证中间件
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: '访问令牌缺失',
        code: 'TOKEN_MISSING'
      });
      return;
    }

    // 验证JWT令牌
    const decoded = JWTUtils.verifyAccessToken(token);
    
    // 获取用户信息
    const userResult = await AuthService.getUserById(decoded.sub);
    
    if (!userResult.success || !userResult.user) {
      res.status(401).json({
        success: false,
        message: '用户不存在',
        code: 'USER_NOT_FOUND'
      });
      return;
    }

    // 检查用户状态
    if (userResult.user.status !== 'active') {
      res.status(403).json({
        success: false,
        message: '账户已被禁用',
        code: 'ACCOUNT_DISABLED'
      });
      return;
    }

    // 将用户信息添加到请求对象
    req.user = userResult.user;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Invalid access token') {
        res.status(401).json({
          success: false,
          message: '访问令牌无效',
          code: 'TOKEN_INVALID'
        });
        return;
      }
    }

    res.status(500).json({
      success: false,
      message: '认证过程中发生错误',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * 可选认证中间件（不强制要求登录）
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = JWTUtils.verifyAccessToken(token);
        const userResult = await AuthService.getUserById(decoded.sub);
        
        if (userResult.success && userResult.user && userResult.user.status === 'active') {
          req.user = userResult.user;
          req.token = token;
        }
      } catch (error) {
        // 忽略令牌验证错误，继续处理请求
        console.warn('Optional auth token verification failed:', error);
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next(); // 继续处理请求
  }
};

/**
 * 角色权限检查中间件
 */
export const requireRole = (roles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '需要登录',
        code: 'LOGIN_REQUIRED'
      });
      return;
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        success: false,
        message: '权限不足',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
      return;
    }

    next();
  };
};

/**
 * 管理员权限检查中间件
 */
export const requireAdmin = requireRole('admin');

/**
 * 检查令牌是否即将过期的中间件
 */
export const checkTokenExpiration = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.token) {
    const isExpiringSoon = JWTUtils.isTokenExpiringSoon(req.token);
    
    if (isExpiringSoon) {
      // 在响应头中添加提示
      res.setHeader('X-Token-Expiring', 'true');
      res.setHeader('X-Token-Refresh-Needed', 'true');
    }
  }
  
  next();
};

/**
 * 用户自己或管理员权限检查
 */
export const requireOwnerOrAdmin = (userIdParam: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '需要登录',
        code: 'LOGIN_REQUIRED'
      });
      return;
    }

    const targetUserId = req.params[userIdParam] || req.body[userIdParam];
    const currentUserId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin && currentUserId !== targetUserId) {
      res.status(403).json({
        success: false,
        message: '只能操作自己的数据',
        code: 'ACCESS_DENIED'
      });
      return;
    }

    next();
  };
};

/**
 * API限流中间件（基于用户）
 */
export const rateLimitByUser = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  const userRequestCounts = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const userId = req.user?.id || req.ip!;
    const now = Date.now();
    
    const userRecord = userRequestCounts.get(userId!);
    
    if (!userRecord || now > userRecord.resetTime) {
      // 重置或创建新记录
      userRequestCounts.set(userId!, {
        count: 1,
        resetTime: now + windowMs
      });
      next();
      return;
    }
    
    if (userRecord.count >= maxRequests) {
      res.status(429).json({
        success: false,
        message: '请求过于频繁，请稍后再试',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((userRecord.resetTime - now) / 1000)
      });
      return;
    }
    
    userRecord.count++;
    next();
  };
};