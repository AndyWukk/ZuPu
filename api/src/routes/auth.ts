import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateToken, optionalAuth, checkTokenExpiration, rateLimitByUser } from '../middleware/auth';
import { ValidationUtils } from '../utils/validation';
import { Request, Response, NextFunction } from 'express';

const router = Router();

/**
 * 验证中间件
 */
const validateRegistration = (req: Request, res: Response, next: NextFunction): void => {
  const validation = ValidationUtils.validate(ValidationUtils.registerSchema, req.body);
  if (!validation.isValid) {
    res.status(400).json({
      success: false,
      message: '输入数据验证失败',
      errors: validation.errors
    });
    return;
  }
  req.body = validation.value;
  next();
};

const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const validation = ValidationUtils.validate(ValidationUtils.loginSchema, req.body);
  if (!validation.isValid) {
    res.status(400).json({
      success: false,
      message: '输入数据验证失败',
      errors: validation.errors
    });
    return;
  }
  req.body = validation.value;
  next();
};

/**
 * 用户注册
 * POST /api/auth/register
 */
router.post('/register', 
  rateLimitByUser(5, 15 * 60 * 1000), // 15分钟内最多5次注册尝试
  validateRegistration,
  AuthController.register
);

/**
 * 用户登录
 * POST /api/auth/login
 */
router.post('/login',
  rateLimitByUser(10, 15 * 60 * 1000), // 15分钟内最多10次登录尝试
  validateLogin,
  AuthController.login
);

/**
 * 刷新访问令牌
 * POST /api/auth/refresh
 */
router.post('/refresh',
  rateLimitByUser(20, 60 * 60 * 1000), // 1小时内最多20次刷新
  AuthController.refreshToken
);

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
router.get('/me',
  authenticateToken,
  checkTokenExpiration,
  AuthController.getCurrentUser
);

/**
 * 更新用户资料
 * PUT /api/auth/profile
 */
router.put('/profile',
  authenticateToken,
  checkTokenExpiration,
  rateLimitByUser(10, 60 * 60 * 1000), // 1小时内最多10次更新
  AuthController.updateProfile
);

/**
 * 修改密码
 * PUT /api/auth/password
 */
router.put('/password',
  authenticateToken,
  checkTokenExpiration,
  rateLimitByUser(5, 60 * 60 * 1000), // 1小时内最多5次密码修改
  AuthController.changePassword
);

/**
 * 用户登出
 * POST /api/auth/logout
 */
router.post('/logout',
  authenticateToken,
  AuthController.logout
);

/**
 * 忘记密码
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password',
  rateLimitByUser(3, 60 * 60 * 1000), // 1小时内最多3次密码重置请求
  AuthController.forgotPassword
);

/**
 * 验证邮箱
 * GET /api/auth/verify-email
 */
router.get('/verify-email',
  AuthController.verifyEmail
);

/**
 * 检查认证状态（可选认证）
 * GET /api/auth/status
 */
router.get('/status',
  optionalAuth,
  (req: Request, res: Response): void => {
    res.json({
      success: true,
      data: {
        authenticated: !!req.user,
        user: req.user || null
      }
    });
  }
);

export default router;