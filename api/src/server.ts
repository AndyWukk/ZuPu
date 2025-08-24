import dotenv from 'dotenv';
import path from 'path';
import app from './app';

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// 验证必要的环境变量
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ 缺少必要的环境变量:');
  missingEnvVars.forEach(envVar => {
    console.error(`   - ${envVar}`);
  });
  process.exit(1);
}

// 启动服务器
const server = app.listen(PORT, () => {
  console.log('🚀 族谱编排系统 API 服务器启动成功!');
  console.log(`📍 服务器地址: http://localhost:${PORT}`);
  console.log(`🌍 运行环境: ${NODE_ENV}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/health`);
  console.log(`🔐 认证API: http://localhost:${PORT}/api/auth`);
  console.log('\n✅ 服务器已准备就绪，等待请求...');
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('\n🛑 收到 SIGTERM 信号，开始优雅关闭服务器...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 收到 SIGINT 信号，开始优雅关闭服务器...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的Promise拒绝:', reason);
  console.error('Promise:', promise);
  process.exit(1);
});

export default server;