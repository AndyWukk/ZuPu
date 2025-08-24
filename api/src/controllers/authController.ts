import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { RegisterRequest, LoginRequest, RefreshTokenRequest, ChangePasswordRequest, UpdateProfileRequest } from '../types/auth';
import { ValidationUtils } from '../utils/validation';
import { PasswordUtils } from '../utils/password';
import { supabaseAdmin } from '../config/database';
import { Database } from '../types/database';

export class AuthController {
  /**
   * 用户注册
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const registerData: RegisterRequest = req.body;
      
      const result = await AuthService.register(registerData);
      
      if (result.success) {
        res.status(201).json({
          success: true,
          message: result.message,
          data: {
            user: result.user
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
          errors: result.errors
        });
      }
    } catch (error) {
      console.error('Register controller error:', error);
      res.status(500).json({
        success: false,
        message: '注册过程中发生错误'
      });
    }
  }

  /**
   * 用户登录
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const loginData: LoginRequest = req.body;
      
      const result = await AuthService.login(loginData);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        res.status(401).json({
          success: false,
          message: result.message,
          errors: result.errors
        });
      }
    } catch (error) {
      console.error('Login controller error:', error);
      res.status(500).json({
        success: false,
        message: '登录过程中发生错误'
      });
    }
  }

  /**
   * 刷新访问令牌
   */
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refresh_token }: RefreshTokenRequest = req.body;
      
      if (!refresh_token) {
        res.status(400).json({
          success: false,
          message: '刷新令牌不能为空'
        });
        return;
      }
      
      const result = await AuthService.refreshToken(refresh_token);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        res.status(401).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Refresh token controller error:', error);
      res.status(500).json({
        success: false,
        message: '刷新令牌过程中发生错误'
      });
    }
  }

  /**
   * 获取当前用户信息
   */
  static async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: '用户未登录'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          user: req.user
        }
      });
    } catch (error) {
      console.error('Get current user controller error:', error);
      res.status(500).json({
        success: false,
        message: '获取用户信息失败'
      });
    }
  }

  /**
   * 更新用户资料
   */
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: '用户未登录'
        });
        return;
      }

      const profileData: UpdateProfileRequest = req.body;
      
      // 验证输入数据
      const validation = ValidationUtils.validate(ValidationUtils.updateProfileSchema, profileData);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          message: '输入数据验证失败',
          errors: validation.errors
        });
        return;
      }

      // 更新用户资料
      const updateData = validation.value!;
      const { data: updatedUser, error } = await (supabaseAdmin as any)
        .from('users')
        .update({
          full_name: updateData.full_name,
          phone: updateData.phone,
          avatar_url: updateData.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', req.user.id)
        .select()
        .single();

      if (error) {
        res.status(500).json({
          success: false,
          message: '更新用户资料失败'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: '用户资料更新成功',
        data: {
          user: updatedUser
        }
      });
    } catch (error) {
      console.error('Update profile controller error:', error);
      res.status(500).json({
        success: false,
        message: '更新用户资料过程中发生错误'
      });
    }
  }

  /**
   * 修改密码
   */
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: '用户未登录'
        });
        return;
      }

      const { current_password, new_password }: ChangePasswordRequest = req.body;
      
      // 验证输入数据
      const validation = ValidationUtils.validate(ValidationUtils.changePasswordSchema, {
        current_password,
        new_password
      });
      
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          message: '输入数据验证失败',
          errors: validation.errors
        });
        return;
      }

      // 验证新密码强度
      const passwordStrength = PasswordUtils.validatePasswordStrength(new_password);
      if (!passwordStrength.isValid) {
        res.status(400).json({
          success: false,
          message: '新密码不符合安全要求',
          errors: passwordStrength.errors
        });
        return;
      }

      // 使用Supabase Auth更新密码
      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        req.user.id,
        { password: new_password }
      );

      if (error) {
        res.status(500).json({
          success: false,
          message: '修改密码失败'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: '密码修改成功'
      });
    } catch (error) {
      console.error('Change password controller error:', error);
      res.status(500).json({
        success: false,
        message: '修改密码过程中发生错误'
      });
    }
  }

  /**
   * 用户登出
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: '用户未登录'
        });
        return;
      }

      const result = await AuthService.logout(req.user.id);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Logout controller error:', error);
      res.status(500).json({
        success: false,
        message: '登出过程中发生错误'
      });
    }
  }

  /**
   * 发送密码重置邮件
   */
  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      
      // 验证邮箱格式
      const validation = ValidationUtils.validate(ValidationUtils.emailSchema, { email });
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          message: '邮箱格式不正确',
          errors: validation.errors
        });
        return;
      }

      const normalizedEmail = ValidationUtils.normalizeEmail(email);
      
      // 使用Supabase Auth发送密码重置邮件
      const { error } = await supabaseAdmin.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`
      });

      if (error) {
        console.error('Password reset email error:', error);
      }

      // 无论是否成功，都返回成功消息（安全考虑）
      res.status(200).json({
        success: true,
        message: '如果该邮箱已注册，您将收到密码重置邮件'
      });
    } catch (error) {
      console.error('Forgot password controller error:', error);
      res.status(500).json({
        success: false,
        message: '发送密码重置邮件过程中发生错误'
      });
    }
  }

  /**
   * 验证邮箱
   */
  static async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        res.status(400).json({
          success: false,
          message: '验证令牌无效'
        });
        return;
      }

      // 使用Supabase Auth验证邮箱
      const { error } = await supabaseAdmin.auth.verifyOtp({
        token_hash: token,
        type: 'email'
      });

      if (error) {
        res.status(400).json({
          success: false,
          message: '邮箱验证失败'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: '邮箱验证成功'
      });
    } catch (error) {
      console.error('Verify email controller error:', error);
      res.status(500).json({
        success: false,
        message: '邮箱验证过程中发生错误'
      });
    }
  }
}