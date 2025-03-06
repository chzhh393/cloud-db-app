'use client';

// 云开发SDK封装
import cloudbase from '@cloudbase/js-sdk';
import { AITask, TaskFilter } from './types';

// 检查是否在客户端环境
const isClient = typeof window !== 'undefined';

// 获取通过CDN方式初始化的云开发应用实例
export const getCloudbaseApp = () => {
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
export const getAuth = async () => {
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
  
  const app = getCloudbaseApp();
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
  const app = getCloudbaseApp();
  if (!app) return null;
  
  try {
    // 确保已登录
    const auth = await getAuth();
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

// AI任务相关操作封装
export const aiTasksService = {
  // 创建任务
  async createTask(taskData: any) {
    try {
      // 确保已登录
      await getAuth();
      
      // 获取应用实例
      const app = getCloudbaseApp();
      if (!app) {
        throw new Error('只能在客户端环境中操作数据');
      }
      
      // 获取数据库对象
      const db = app.database();
      
      // 创建集合引用
      const collection = db.collection('ai_tasks');
      
      // 添加数据
      const result = await collection.add(taskData);
      
      console.log('创建任务成功:', result);
      return result;
    } catch (error) {
      console.error("创建任务失败:", error);
      throw error;
    }
  },

  // 查询任务列表
  async getTasks(filter = {}) {
    try {
      // 确保已登录
      await getAuth();
      
      // 获取应用实例
      const app = getCloudbaseApp();
      if (!app) {
        throw new Error('只能在客户端环境中操作数据');
      }
      
      // 获取数据库对象
      const db = app.database();
      
      // 创建集合引用
      const collection = db.collection('ai_tasks');
      
      // 查询数据
      let query = collection.where(filter);
      
      // 执行查询
      const result = await query.get();
      
      console.log('获取任务列表成功:', result);
      
      // 确保返回数组
      if (result && result.data) {
        return Array.isArray(result.data) ? result.data : [];
      }
      
      return [];
    } catch (error) {
      console.error("查询任务列表失败:", error);
      throw error;
    }
  },

  // 查询单个任务
  async getTaskById(id: string) {
    try {
      // 确保已登录
      await getAuth();
      
      // 获取应用实例
      const app = getCloudbaseApp();
      if (!app) {
        throw new Error('只能在客户端环境中操作数据');
      }
      
      // 获取数据库对象
      const db = app.database();
      
      // 创建集合引用
      const collection = db.collection('ai_tasks');
      
      // 查询数据
      const result = await collection.doc(id).get();
      
      console.log('获取任务详情成功:', result);
      
      // 返回单个文档
      if (result && result.data && result.data.length > 0) {
        return result.data[0];
      }
      
      return null;
    } catch (error) {
      console.error("查询单个任务失败:", error);
      throw error;
    }
  },

  // 更新任务
  async updateTask(id: string, updateData: any) {
    try {
      // 确保已登录
      await getAuth();
      
      // 获取应用实例
      const app = getCloudbaseApp();
      if (!app) {
        throw new Error('只能在客户端环境中操作数据');
      }
      
      // 获取数据库对象
      const db = app.database();
      
      // 创建集合引用
      const collection = db.collection('ai_tasks');
      
      // 更新数据
      const result = await collection.doc(id).update(updateData);
      
      console.log('更新任务成功:', result);
      return result;
    } catch (error) {
      console.error("更新任务失败:", error);
      throw error;
    }
  },

  // 删除任务
  async deleteTask(id: string) {
    try {
      // 确保已登录
      await getAuth();
      
      // 获取应用实例
      const app = getCloudbaseApp();
      if (!app) {
        throw new Error('只能在客户端环境中操作数据');
      }
      
      // 获取数据库对象
      const db = app.database();
      
      // 创建集合引用
      const collection = db.collection('ai_tasks');
      
      // 删除数据
      const result = await collection.doc(id).remove();
      
      console.log('删除任务成功:', result);
      return result;
    } catch (error) {
      console.error("删除任务失败:", error);
      throw error;
    }
  },

  // 创建问题
  createProblem: async (problemData: any) => {
    try {
      const models = getModels();
      if (!models) {
        throw new Error('无法获取数据模型');
      }
      
      // 添加创建时间
      const data = {
        ...problemData,
        created_at: new Date()
      };
      
      const { data: result } = await models.ai_problems.create({
        data
      });
      
      console.log('问题创建成功:', result);
      return result;
    } catch (error) {
      console.error('创建问题失败:', error);
      throw error;
    }
  },
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

