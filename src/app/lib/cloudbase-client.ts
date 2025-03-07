'use client';

import cloudbase from '@cloudbase/js-sdk';

// 云开发环境ID
const ENV_ID = 'dev-8grd339lb1d943ec';

let app: any = null;
let auth: any = null;

// 获取云开发应用实例（仅客户端使用）
export const getCloudBaseClient = () => {
  if (typeof window === 'undefined') {
    console.error('getCloudBaseClient 只能在客户端环境中使用');
    return null;
  }
  
  if (!app) {
    try {
      app = cloudbase.init({
        env: ENV_ID,
        clientId: ENV_ID, // 添加clientId参数
        region: 'ap-shanghai',
        timeout: 60000
      });
      console.log('云开发客户端初始化成功', { env: ENV_ID });
    } catch (error) {
      console.error('云开发客户端初始化失败:', error);
      return null;
    }
  }
  
  return app;
};

// 获取认证实例（仅客户端使用）
export const getAuthClient = async () => {
  if (typeof window === 'undefined') {
    console.error('getAuthClient 只能在客户端环境中使用');
    return null;
  }
  
  const app = getCloudBaseClient();
  if (!app) return null;
  
  if (!auth) {
    auth = app.auth({ persistence: 'local' });
  }
  
  // 尝试获取登录状态
  const loginState = await auth.getLoginState();
  console.log('当前登录状态:', loginState ? '已登录' : '未登录');
  
  // 如果未登录，则进行匿名登录
  if (!loginState) {
    try {
      await auth.anonymousAuthProvider().signIn();
      console.log('匿名登录成功');
      
      // 再次验证登录状态
      const newLoginState = await auth.getLoginState();
      console.log('登录后状态:', newLoginState ? '已登录' : '仍未登录', newLoginState || '');
    } catch (error) {
      console.error('匿名登录失败:', error);
      return null;
    }
  }
  
  return auth;
};

// 辅助函数：确保在进行数据库操作前已登录
export const ensureAuthenticated = async () => {
  const auth = await getAuthClient();
  if (!auth) {
    throw new Error('认证失败，无法访问数据库');
  }
  return auth;
};

// 获取models API实例
export const getModelsAPI = async () => {
  await ensureAuthenticated();
  const app = getCloudBaseClient();
  if (!app) {
    throw new Error('获取云开发客户端失败');
  }
  return app.models;
};

// 辅助函数：获取已验证的数据库实例
export const getAuthenticatedDB = async () => {
  await ensureAuthenticated();
  const app = getCloudBaseClient();
  if (!app) {
    throw new Error('获取云开发客户端失败');
  }
  return app.database();
};

// 辅助函数：测试数据库连接
export const testDatabaseConnection = async () => {
  try {
    await ensureAuthenticated();
    const app = getCloudBaseClient();
    if (!app) {
      return { success: false, message: '获取云开发客户端失败' };
    }
    
    // 使用models API测试连接
    try {
      const models = app.models;
      if (!models) {
        return { success: false, message: 'models API不可用，可能需要更新SDK版本' };
      }
      
      // 尝试列出数据库中的集合
      const collections = await models.getCollections();
      return { 
        success: true, 
        message: '数据库连接测试成功',
        data: collections
      };
    } catch (modelError) {
      console.error('Models API错误:', modelError);
      
      // 如果models API失败，回退到database API
      try {
        const db = app.database();
        // 使用count操作，通常比获取数据更轻量
        const testResult = await db.collection('ai_tasks').count();
        return { 
          success: true, 
          message: '数据库连接测试成功(database API)',
          data: testResult
        };
      } catch (dbError) {
        return { 
          success: false, 
          message: '数据库连接测试失败(两种API都失败)',
          error: dbError instanceof Error ? dbError.message : dbError,
          originalError: modelError instanceof Error ? modelError.message : modelError
        };
      }
    }
  } catch (error) {
    return { 
      success: false, 
      message: '数据库连接测试失败',
      error: error instanceof Error ? error.message : error
    };
  }
}; 

