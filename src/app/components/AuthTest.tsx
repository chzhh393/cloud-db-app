'use client';

import { useState } from 'react';
import { getCloudbaseApp, getAuth } from '../lib/cloudbase';

export default function AuthTest() {
  const [authResult, setAuthResult] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    message: string;
    details: string;
  }>({
    status: 'idle',
    message: '未开始测试',
    details: '',
  });
  
  const [loading, setLoading] = useState(false);

  const testAuth = async () => {
    setLoading(true);
    setAuthResult({
      status: 'loading',
      message: '正在测试认证...',
      details: '',
    });

    try {
      // 测试初始化
      console.log('开始测试认证流程');
      const app = getCloudbaseApp();
      
      if (!app) {
        setAuthResult({
          status: 'error',
          message: 'SDK初始化失败',
          details: '无法初始化腾讯云开发SDK，请检查环境ID和网络连接',
        });
        setLoading(false);
        return;
      }
      
      console.log('SDK初始化成功，尝试获取认证对象');
      
      // 获取认证对象
      try {
        const auth = app.auth({
          persistence: "local",
        });
        
        console.log('认证对象获取成功，检查登录状态');
        
        // 检查登录状态
        try {
          const loginState = await auth.getLoginState();
          console.log('当前登录状态:', loginState);
          
          if (loginState) {
            setAuthResult({
              status: 'success',
              message: '已有登录状态',
              details: `用户ID: ${loginState.user?.uid || '未知'}\n登录类型: ${(loginState as any).credential?.loginType || '未知'}`,
            });
            setLoading(false);
            return;
          }
          
          console.log('无登录状态，尝试匿名登录');
          
          // 尝试匿名登录
          try {
            const anonymousResult = await auth.signInAnonymously();
            console.log('匿名登录结果:', anonymousResult);
            
            if (anonymousResult) {
              setAuthResult({
                status: 'success',
                message: '匿名登录成功',
                details: `用户ID: ${anonymousResult.user?.uid || '未知'}`,
              });
            } else {
              setAuthResult({
                status: 'error',
                message: '匿名登录失败',
                details: '未返回登录结果',
              });
            }
          } catch (loginError) {
            console.error('匿名登录出错:', loginError);
            setAuthResult({
              status: 'error',
              message: '匿名登录失败',
              details: loginError instanceof Error ? loginError.message : String(loginError),
            });
          }
        } catch (stateError) {
          console.error('获取登录状态出错:', stateError);
          setAuthResult({
            status: 'error',
            message: '获取登录状态失败',
            details: stateError instanceof Error ? stateError.message : String(stateError),
          });
        }
      } catch (authError) {
        console.error('获取认证对象出错:', authError);
        setAuthResult({
          status: 'error',
          message: '获取认证对象失败',
          details: authError instanceof Error ? authError.message : String(authError),
        });
      }
    } catch (err) {
      console.error('认证测试过程出错:', err);
      setAuthResult({
        status: 'error',
        message: '认证测试过程出错',
        details: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">腾讯云开发认证测试</h2>
      
      <button
        onClick={testAuth}
        disabled={loading}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {loading ? '测试中...' : '测试认证'}
      </button>
      
      <div className={`p-4 rounded-md mb-4 ${
        authResult.status === 'idle' ? 'bg-gray-100' :
        authResult.status === 'loading' ? 'bg-blue-100 text-blue-800' :
        authResult.status === 'success' ? 'bg-green-100 text-green-800' :
        'bg-red-100 text-red-800'
      }`}>
        <h3 className="font-medium mb-2">状态: {authResult.message}</h3>
        {authResult.details && (
          <pre className="whitespace-pre-wrap text-sm mt-2 p-2 bg-white bg-opacity-50 rounded">
            {authResult.details}
          </pre>
        )}
      </div>
      
      <div className="text-sm text-gray-600 mt-4">
        <h3 className="font-medium mb-2">常见问题解决方法:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>确保在腾讯云开发控制台中已开启匿名登录</li>
          <li>检查环境ID是否正确: <code>dev-8grd339lb1d943ec</code></li>
          <li>确认数据表 <code>ai_tasks</code> 已创建并设置了适当的权限</li>
          <li>检查网络连接是否正常</li>
        </ul>
      </div>
    </div>
  );
} 

