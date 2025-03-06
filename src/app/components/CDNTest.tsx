'use client';

import { useState, useEffect } from 'react';
import { getCloudbaseAppFromCDN, getAuthFromCDN, getDBFromCDN } from '../lib/cloudbase-cdn';

export default function CDNTest() {
  const [status, setStatus] = useState<{
    sdkLoaded: boolean;
    appInitialized: boolean;
    authSuccess: boolean;
    dbSuccess: boolean;
    userId: string;
    message: string;
    errorDetails: string;
    hostname: string;
  }>({
    sdkLoaded: false,
    appInitialized: false,
    authSuccess: false,
    dbSuccess: false,
    userId: '',
    message: '未开始测试',
    errorDetails: '',
    hostname: '',
  });
  
  const [loading, setLoading] = useState(false);

  // 检查SDK是否已加载并获取主机名
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setStatus(prev => ({
        ...prev,
        sdkLoaded: !!window.cloudbase,
        hostname: window.location.hostname,
      }));
    }
  }, []);

  // 直接进行匿名登录测试
  const testAnonymousLogin = async () => {
    setLoading(true);
    setStatus(prev => ({ 
      ...prev, 
      message: '正在测试匿名登录...',
      errorDetails: '' 
    }));

    try {
      if (!window.cloudbase) {
        setStatus(prev => ({
          ...prev,
          message: 'SDK未加载，请检查脚本是否正确引入',
          errorDetails: '无法找到window.cloudbase对象'
        }));
        setLoading(false);
        return;
      }

      // 直接初始化一个新的应用实例
      const app = window.cloudbase.init({
        env: 'dev-8grd339lb1d943ec',
        region: 'ap-shanghai' // 明确指定地域
      });

      // 创建认证对象
      const auth = app.auth({
        persistence: "local"
      });

      // 尝试匿名登录
      try {
        const loginResult = await auth.signInAnonymously();
        console.log('匿名登录测试结果:', loginResult);
        
        if (loginResult && loginResult.user) {
          setStatus(prev => ({
            ...prev,
            authSuccess: true,
            userId: loginResult.user.uid,
            message: `匿名登录成功，用户ID: ${loginResult.user.uid}`,
            errorDetails: ''
          }));
        } else {
          setStatus(prev => ({
            ...prev,
            authSuccess: false,
            message: '匿名登录失败，未返回用户信息',
            errorDetails: JSON.stringify(loginResult, null, 2)
          }));
        }
      } catch (loginError: any) {
        console.error('匿名登录测试失败:', loginError);
        setStatus(prev => ({
          ...prev,
          authSuccess: false,
          message: '匿名登录失败',
          errorDetails: `错误代码: ${loginError.code || '未知'}\n错误信息: ${loginError.message || '未知'}\n完整错误: ${JSON.stringify(loginError, null, 2)}`
        }));
      }
    } catch (error: any) {
      console.error('测试过程出错:', error);
      setStatus(prev => ({
        ...prev,
        message: '测试过程出错',
        errorDetails: `错误信息: ${error.message || '未知'}\n完整错误: ${JSON.stringify(error, null, 2)}`
      }));
    } finally {
      setLoading(false);
    }
  };

  const testCDNIntegration = async () => {
    setLoading(true);
    setStatus(prev => ({ 
      ...prev, 
      message: '测试中...',
      errorDetails: '' 
    }));

    try {
      // 检查SDK是否已加载
      if (!window.cloudbase) {
        setStatus(prev => ({
          ...prev,
          sdkLoaded: false,
          appInitialized: false,
          authSuccess: false,
          dbSuccess: false,
          message: 'SDK未加载，请检查脚本是否正确引入',
          errorDetails: '无法找到window.cloudbase对象'
        }));
        setLoading(false);
        return;
      }

      // 尝试获取应用实例
      const app = getCloudbaseAppFromCDN();
      if (!app) {
        setStatus(prev => ({
          ...prev,
          sdkLoaded: true,
          appInitialized: false,
          authSuccess: false,
          dbSuccess: false,
          message: '应用初始化失败，请检查环境ID',
          errorDetails: '无法初始化应用实例'
        }));
        setLoading(false);
        return;
      }

      // 尝试认证
      const auth = await getAuthFromCDN();
      if (!auth) {
        setStatus(prev => ({
          ...prev,
          sdkLoaded: true,
          appInitialized: true,
          authSuccess: false,
          dbSuccess: false,
          message: '认证失败，请检查权限设置和安全域名',
          errorDetails: '无法获取认证对象或认证失败'
        }));
        setLoading(false);
        return;
      }

      // 获取登录状态
      try {
        const loginState = await auth.getLoginState();
        const userId = loginState?.user?.uid || '未知';
        
        // 尝试获取数据库对象
        const db = await getDBFromCDN();
        const dbSuccess = !!db;
        
        setStatus(prev => ({
          ...prev,
          sdkLoaded: true,
          appInitialized: true,
          authSuccess: true,
          dbSuccess,
          userId,
          message: `认证成功，用户ID: ${userId}${dbSuccess ? '，数据库连接成功' : '，数据库连接失败'}`,
          errorDetails: ''
        }));
      } catch (stateError: any) {
        console.error('获取登录状态失败:', stateError);
        setStatus(prev => ({
          ...prev,
          sdkLoaded: true,
          appInitialized: true,
          authSuccess: false,
          message: '获取登录状态失败',
          errorDetails: `错误代码: ${stateError.code || '未知'}\n错误信息: ${stateError.message || '未知'}\n完整错误: ${JSON.stringify(stateError, null, 2)}`
        }));
      }
    } catch (error: any) {
      console.error('CDN测试失败:', error);
      setStatus(prev => ({
        ...prev,
        message: '测试过程出错',
        errorDetails: `错误信息: ${error.message || '未知'}\n完整错误: ${JSON.stringify(error, null, 2)}`
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">CDN方式SDK测试</h2>
      
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <span className="w-32">当前主机名:</span>
          <span className="font-mono">{status.hostname}</span>
        </div>
        
        <div className="flex items-center mb-2">
          <span className="w-32">SDK加载状态:</span>
          <span className={status.sdkLoaded ? "text-green-600" : "text-red-600"}>
            {status.sdkLoaded ? "✓ 已加载" : "✗ 未加载"}
          </span>
        </div>
        
        <div className="flex items-center mb-2">
          <span className="w-32">应用初始化:</span>
          <span className={status.appInitialized ? "text-green-600" : "text-red-600"}>
            {status.appInitialized ? "✓ 成功" : "✗ 失败"}
          </span>
        </div>
        
        <div className="flex items-center mb-2">
          <span className="w-32">认证状态:</span>
          <span className={status.authSuccess ? "text-green-600" : "text-red-600"}>
            {status.authSuccess ? "✓ 成功" : "✗ 失败"}
          </span>
        </div>
        
        <div className="flex items-center mb-2">
          <span className="w-32">数据库连接:</span>
          <span className={status.dbSuccess ? "text-green-600" : "text-red-600"}>
            {status.dbSuccess ? "✓ 成功" : "✗ 失败"}
          </span>
        </div>
        
        {status.userId && (
          <div className="flex items-center mb-2">
            <span className="w-32">用户ID:</span>
            <span className="text-blue-600 font-mono">{status.userId}</span>
          </div>
        )}
        
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <p className="text-gray-700">{status.message}</p>
        </div>
        
        {status.errorDetails && (
          <div className="mt-2 p-3 bg-red-50 rounded border border-red-200">
            <h4 className="text-red-700 font-medium mb-1">错误详情:</h4>
            <pre className="text-xs overflow-auto whitespace-pre-wrap text-red-600 max-h-40">
              {status.errorDetails}
            </pre>
          </div>
        )}
      </div>
      
      <div className="flex space-x-2">
        <button
          onClick={testCDNIntegration}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? '测试中...' : '测试CDN集成'}
        </button>
        
        <button
          onClick={testAnonymousLogin}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
        >
          {loading ? '测试中...' : '测试匿名登录'}
        </button>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <h3 className="font-medium mb-2">常见问题解决方法:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li className="text-red-600 font-medium">确保在腾讯云开发控制台中添加了安全域名: <code>{status.hostname}</code></li>
          <li>确保在腾讯云开发控制台中已开启匿名登录</li>
          <li>检查环境ID是否正确: <code>dev-8grd339lb1d943ec</code></li>
          <li>确认数据表 <code>ai_tasks</code> 已创建并设置了适当的权限</li>
          <li>检查网络连接是否正常</li>
        </ul>
      </div>
    </div>
  );
} 

