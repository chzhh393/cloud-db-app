'use client';

// 检查是否在客户端环境
const isClient = typeof window !== 'undefined';

// 获取通过CDN方式初始化的云开发应用实例
export const getCloudbaseAppFromCDN = () => {
  if (!isClient) {
    console.error('Cloudbase SDK 只能在客户端环境中使用');
    return null;
  }
  
  try {
    // 尝试获取全局window对象中的tcbApp实例
    if (window.tcbApp) {
      return window.tcbApp;
    }
    
    // 如果没有找到预初始化的实例，尝试手动初始化
    if (window.cloudbase) {
      const app = window.cloudbase.init({
        env: 'dev-8grd339lb1d943ec', // 您的环境id
        region: 'ap-shanghai' // 明确指定地域
      });
      window.tcbApp = app;
      return app;
    }
    
    console.error('未找到腾讯云开发SDK');
    return null;
  } catch (error) {
    console.error('获取腾讯云开发应用实例失败:', error);
    return null;
  }
};

// 获取认证对象并登录
export const getAuthFromCDN = async () => {
  // 如果已经有全局认证对象，直接使用
  if (isClient && window.tcbAuth) {
    // 检查是否已登录
    try {
      const loginState = await window.tcbAuth.getLoginState();
      if (loginState) {
        console.log('使用全局认证对象，已有登录状态');
        return window.tcbAuth;
      }
    } catch (e) {
      console.log('全局认证对象检查失败，尝试重新认证');
    }
  }
  
  const app = getCloudbaseAppFromCDN();
  if (!app) return null;
  
  try {
    // 获取auth对象
    const auth = app.auth({
      persistence: "local" // 持久化存储登录态
    });
    
    // 保存到全局变量
    if (isClient) {
      window.tcbAuth = auth;
    }

    // 检查当前登录状态
    try {
      const loginState = await auth.getLoginState();
      console.log('当前登录状态(CDN方式):', loginState);
      
      if (!loginState) {
        console.log('尝试匿名登录(CDN方式)...');
        try {
          // 进行匿名登录
          const anonymousResult = await auth.signInAnonymously();
          console.log('匿名登录结果(CDN方式):', anonymousResult);
          
          if (!anonymousResult) {
            console.error('匿名登录失败(CDN方式): 未返回结果');
            return null;
          }
          
          console.log('匿名登录成功(CDN方式)，用户ID:', anonymousResult.user?.uid);
          
          // 保存登录状态到全局变量
          if (isClient) {
            window.tcbLoginState = anonymousResult;
          }
          
          return auth;
        } catch (loginError: any) {
          console.error('匿名登录失败(CDN方式):', loginError);
          // 输出详细错误信息
          console.error('错误代码:', loginError.code || '未知');
          console.error('错误信息:', loginError.message || '未知');
          return null;
        }
      } else {
        console.log('已有登录状态(CDN方式)，用户ID:', loginState.user?.uid);
        
        // 保存登录状态到全局变量
        if (isClient) {
          window.tcbLoginState = loginState;
        }
        
        return auth;
      }
    } catch (stateError: any) {
      console.error('获取登录状态失败(CDN方式):', stateError);
      console.error('错误代码:', stateError.code || '未知');
      console.error('错误信息:', stateError.message || '未知');
      return null;
    }
  } catch (error) {
    console.error('认证对象创建失败(CDN方式):', error);
    return null;
  }
};

// 获取数据库操作对象
export const getDBFromCDN = async () => {
  const app = getCloudbaseAppFromCDN();
  if (!app) return null;
  
  try {
    // 确保已登录
    const auth = await getAuthFromCDN();
    if (!auth) {
      throw new Error('认证失败，无法获取数据库操作对象');
    }
    
    // 获取数据库对象
    const db = app.database();
    return db;
  } catch (error) {
    console.error('获取数据库操作对象失败:', error);
    return null;
  }
};

// 声明全局Window接口扩展
declare global {
  interface Window {
    cloudbase?: any;
    tcbApp?: any;
    tcbAuth?: any;
    tcbLoginState?: any;
  }
} 

