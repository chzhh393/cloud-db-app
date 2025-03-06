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
        clientId: ENV_ID,
      });
      console.log('云开发客户端初始化成功');
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
  
  // 如果未登录，则进行匿名登录
  if (!loginState) {
    try {
      await auth.anonymousAuthProvider().signIn();
      console.log('匿名登录成功');
    } catch (error) {
      console.error('匿名登录失败:', error);
      return null;
    }
  }
  
  return auth;
}; 

