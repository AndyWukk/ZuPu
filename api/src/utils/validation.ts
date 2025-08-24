import Joi from 'joi';
import { RegisterRequest, LoginRequest, ChangePasswordRequest, UpdateProfileRequest } from '../types/auth';

export class ValidationUtils {
  // 用户注册验证
  static readonly registerSchema = Joi.object<RegisterRequest>({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': '请输入有效的邮箱地址',
        'any.required': '邮箱是必填项'
      }),
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
      .required()
      .messages({
        'string.min': '密码长度至少8位',
        'string.max': '密码长度不能超过128位',
        'string.pattern.base': '密码必须包含大小写字母、数字和特殊字符',
        'any.required': '密码是必填项'
      }),
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .required()
      .messages({
        'string.alphanum': '用户名只能包含字母和数字',
        'string.min': '用户名长度至少3位',
        'string.max': '用户名长度不能超过30位',
        'any.required': '用户名是必填项'
      }),
    full_name: Joi.string()
      .max(100)
      .optional()
      .messages({
        'string.max': '姓名长度不能超过100位'
      }),
    phone: Joi.string()
      .pattern(/^1[3-9]\d{9}$/)
      .optional()
      .messages({
        'string.pattern.base': '请输入有效的手机号码'
      })
  });

  // 用户登录验证
  static readonly loginSchema = Joi.object<LoginRequest>({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': '请输入有效的邮箱地址',
        'any.required': '邮箱是必填项'
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': '密码是必填项'
      })
  });

  // 修改密码验证
  static readonly changePasswordSchema = Joi.object<ChangePasswordRequest>({
    current_password: Joi.string()
      .required()
      .messages({
        'any.required': '当前密码是必填项'
      }),
    new_password: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
      .required()
      .messages({
        'string.min': '新密码长度至少8位',
        'string.max': '新密码长度不能超过128位',
        'string.pattern.base': '新密码必须包含大小写字母、数字和特殊字符',
        'any.required': '新密码是必填项'
      })
  });

  // 更新用户资料验证
  static readonly updateProfileSchema = Joi.object<UpdateProfileRequest>({
    full_name: Joi.string()
      .max(100)
      .optional()
      .messages({
        'string.max': '姓名长度不能超过100位'
      }),
    phone: Joi.string()
      .pattern(/^1[3-9]\d{9}$/)
      .optional()
      .messages({
        'string.pattern.base': '请输入有效的手机号码'
      }),
    avatar_url: Joi.string()
      .uri()
      .optional()
      .messages({
        'string.uri': '请输入有效的头像URL'
      })
  });

  // 邮箱验证
  static readonly emailSchema = Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': '请输入有效的邮箱地址',
        'any.required': '邮箱是必填项'
      })
  });

  // UUID验证
  static readonly uuidSchema = Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': '无效的ID格式',
      'any.required': 'ID是必填项'
    });

  // 分页参数验证
  static readonly paginationSchema = Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.integer': '页码必须是整数',
        'number.min': '页码必须大于0'
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10)
      .messages({
        'number.integer': '每页数量必须是整数',
        'number.min': '每页数量必须大于0',
        'number.max': '每页数量不能超过100'
      })
  });

  /**
   * 验证数据
   */
  static validate<T>(schema: Joi.ObjectSchema<T>, data: any): {
    isValid: boolean;
    value?: T;
    errors?: string[];
  } {
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return {
        isValid: false,
        errors: error.details.map(detail => detail.message)
      };
    }

    return {
      isValid: true,
      value
    };
  }

  /**
   * 验证邮箱格式
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 验证手机号格式
   */
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * 验证UUID格式
   */
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * 清理和标准化邮箱
   */
  static normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  /**
   * 清理和标准化用户名
   */
  static normalizeUsername(username: string): string {
    return username.toLowerCase().trim();
  }
}