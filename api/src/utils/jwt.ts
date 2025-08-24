import jwt from 'jsonwebtoken';
import { JWTPayload, User } from '../types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export class JWTUtils {
  /**
   * 生成访问令牌
   */
  static generateAccessToken(user: User): string {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    };

    return (jwt.sign as any)(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'genealogy-system',
      audience: 'genealogy-users'
    });
  }

  /**
   * 生成刷新令牌
   */
  static generateRefreshToken(userId: string): string {
    return (jwt.sign as any)(
      { sub: userId, type: 'refresh' },
      JWT_REFRESH_SECRET,
      {
        expiresIn: JWT_REFRESH_EXPIRES_IN,
        issuer: 'genealogy-system',
        audience: 'genealogy-users'
      }
    );
  }

  /**
   * 验证访问令牌
   */
  static verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET, {
        issuer: 'genealogy-system',
        audience: 'genealogy-users'
      }) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  /**
   * 验证刷新令牌
   */
  static verifyRefreshToken(token: string): { sub: string; type: string } {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET, {
        issuer: 'genealogy-system',
        audience: 'genealogy-users'
      }) as { sub: string; type: string };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * 从令牌中提取用户ID（不验证）
   */
  static extractUserIdFromToken(token: string): string | null {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      return decoded?.sub || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 检查令牌是否即将过期（30分钟内）
   */
  static isTokenExpiringSoon(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      if (!decoded?.exp) return true;
      
      const now = Math.floor(Date.now() / 1000);
      const thirtyMinutes = 30 * 60;
      
      return decoded.exp - now < thirtyMinutes;
    } catch (error) {
      return true;
    }
  }

  /**
   * 获取令牌过期时间
   */
  static getTokenExpirationTime(): number {
    // 返回秒数
    const expiresIn = JWT_EXPIRES_IN;
    if (typeof expiresIn === 'string') {
      if (expiresIn.endsWith('h')) {
        return parseInt(expiresIn) * 3600;
      } else if (expiresIn.endsWith('d')) {
        return parseInt(expiresIn) * 24 * 3600;
      } else if (expiresIn.endsWith('m')) {
        return parseInt(expiresIn) * 60;
      }
    }
    return 24 * 3600; // 默认24小时
  }
}