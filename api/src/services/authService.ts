import { supabaseAdmin, supabase } from '../config/database';
import { User, RegisterRequest, LoginRequest, LoginResponse } from '../types/auth';
import { JWTUtils } from '../utils/jwt';
import { PasswordUtils } from '../utils/password';
import { ValidationUtils } from '../utils/validation';

export class AuthService {
  /**
   * 用户注册
   */
  static async register(registerData: RegisterRequest): Promise<{
    success: boolean;
    user?: User;
    message?: string;
    errors?: string[];
  }> {
    try {
      // 验证输入数据
      const validation = ValidationUtils.validate(ValidationUtils.registerSchema, registerData);
      if (!validation.isValid) {
        return {
          success: false,
          message: '输入数据验证失败',
          errors: validation.errors
        };
      }

      const { email, password, username, full_name, phone } = validation.value!;

      // 标准化邮箱和用户名
      const normalizedEmail = ValidationUtils.normalizeEmail(email);
      const normalizedUsername = ValidationUtils.normalizeUsername(username);

      // 检查邮箱是否已存在
      const { data: existingEmailUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', normalizedEmail)
        .single();

      if (existingEmailUser) {
        return {
          success: false,
          message: '该邮箱已被注册'
        };
      }

      // 检查用户名是否已存在
      const { data: existingUsernameUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('username', normalizedUsername)
        .single();

      if (existingUsernameUser) {
        return {
          success: false,
          message: '该用户名已被使用'
        };
      }

      // 使用Supabase Auth创建用户
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          username: normalizedUsername,
          full_name: full_name || null,
          phone: phone || null
        }
      });

      if (authError || !authData.user) {
        return {
          success: false,
          message: authError?.message || '创建用户失败'
        };
      }

      // 在users表中创建用户记录
      const { data: userData, error: userError } = await (supabaseAdmin as any)
        .from('users')
        .insert({
          id: authData.user.id,
          email: normalizedEmail,
          username: normalizedUsername,
          full_name: full_name || null,
          phone: phone || null,
          role: 'user',
          status: 'active'
        })
        .select()
        .single();

      if (userError || !userData) {
        // 如果创建用户记录失败，删除Auth用户
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return {
          success: false,
          message: '创建用户记录失败'
        };
      }

      return {
        success: true,
        user: userData as User,
        message: '注册成功'
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: '注册过程中发生错误'
      };
    }
  }

  /**
   * 用户登录
   */
  static async login(loginData: LoginRequest): Promise<{
    success: boolean;
    data?: LoginResponse;
    message?: string;
    errors?: string[];
  }> {
    try {
      // 验证输入数据
      const validation = ValidationUtils.validate(ValidationUtils.loginSchema, loginData);
      if (!validation.isValid) {
        return {
          success: false,
          message: '输入数据验证失败',
          errors: validation.errors
        };
      }

      const { email, password } = validation.value!;
      const normalizedEmail = ValidationUtils.normalizeEmail(email);

      // 使用Supabase Auth进行登录
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: password
      });

      if (authError || !authData.user) {
        return {
          success: false,
          message: '邮箱或密码错误'
        };
      }

      // 获取用户详细信息
      const { data: userData, error: userError } = await (supabaseAdmin as any)
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (userError || !userData) {
        return {
          success: false,
          message: '获取用户信息失败'
        };
      }

      // 检查用户状态
      if ((userData as any).status !== 'active') {
        return {
          success: false,
          message: '账户已被禁用，请联系管理员'
        };
      }

      // 更新最后登录时间
      await (supabaseAdmin as any)
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', (userData as any).id);

      // 生成JWT令牌
      const accessToken = JWTUtils.generateAccessToken(userData as User);
      const refreshToken = JWTUtils.generateRefreshToken((userData as any).id);
      const expiresIn = JWTUtils.getTokenExpirationTime();

      return {
        success: true,
        data: {
          user: userData as User,
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: expiresIn
        },
        message: '登录成功'
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: '登录过程中发生错误'
      };
    }
  }

  /**
   * 刷新访问令牌
   */
  static async refreshToken(refreshToken: string): Promise<{
    success: boolean;
    data?: { access_token: string; expires_in: number };
    message?: string;
  }> {
    try {
      // 验证刷新令牌
      const decoded = JWTUtils.verifyRefreshToken(refreshToken);
      
      if (decoded.type !== 'refresh') {
        return {
          success: false,
          message: '无效的刷新令牌'
        };
      }

      // 获取用户信息
      const { data: userData, error: userError } = await (supabaseAdmin as any)
        .from('users')
        .select('*')
        .eq('id', decoded.sub)
        .single();

      if (userError || !userData) {
        return {
          success: false,
          message: '用户不存在'
        };
      }

      // 检查用户状态
      if ((userData as any).status !== 'active') {
        return {
          success: false,
          message: '账户已被禁用'
        };
      }

      // 生成新的访问令牌
      const accessToken = JWTUtils.generateAccessToken(userData as User);
      const expiresIn = JWTUtils.getTokenExpirationTime();

      return {
        success: true,
        data: {
          access_token: accessToken,
          expires_in: expiresIn
        },
        message: '令牌刷新成功'
      };
    } catch (error) {
      console.error('Refresh token error:', error);
      return {
        success: false,
        message: '刷新令牌失败'
      };
    }
  }

  /**
   * 获取用户信息
   */
  static async getUserById(userId: string): Promise<{
    success: boolean;
    user?: User;
    message?: string;
  }> {
    try {
      const { data: userData, error: userError } = await (supabaseAdmin as any)
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        return {
          success: false,
          message: '用户不存在'
        };
      }

      return {
        success: true,
        user: userData as User
      };
    } catch (error) {
      console.error('Get user error:', error);
      return {
        success: false,
        message: '获取用户信息失败'
      };
    }
  }

  /**
   * 用户登出
   */
  static async logout(userId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      // 使用Supabase Admin API登出用户
      const { error } = await supabaseAdmin.auth.admin.signOut(userId);
      
      if (error) {
        console.error('Logout error:', error);
      }

      return {
        success: true,
        message: '登出成功'
      };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        message: '登出失败'
      };
    }
  }
}