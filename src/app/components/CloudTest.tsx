'use client';

import { useState } from 'react';
import { getCloudbaseApp, getAuth } from '../lib/cloudbase';

export default function CloudTest() {
  const [testResults, setTestResults] = useState<{
    sdk: boolean;
    auth: boolean;
    db: boolean;
    message: string;
  }>({
    sdk: false,
    auth: false,
    db: false,
    message: '',
  });

  const runTest = async () => {
    try {
      // 测试SDK初始化
      const app = getCloudbaseApp();
      if (!app) {
        setTestResults({
          sdk: false,
          auth: false,
          db: false,
          message: 'SDK初始化失败',
        });
        return;
      }

      setTestResults(prev => ({ ...prev, sdk: true }));

      // 测试认证
      const auth = await getAuth();
      if (!auth) {
        setTestResults(prev => ({
          ...prev,
          auth: false,
          message: '认证失败',
        }));
        return;
      }

      setTestResults(prev => ({ ...prev, auth: true }));

      // 测试数据库
      try {
        const db = app.database();
        
        // 尝试简单查询
        const result = await db.collection('ai_tasks').limit(1).get();
        console.log('数据库测试结果:', result);
        
        setTestResults(prev => ({
          ...prev,
          db: true,
          message: '所有测试通过',
        }));
      } catch (dbError) {
        console.error('数据库测试失败:', dbError);
        setTestResults(prev => ({
          ...prev,
          db: false,
          message: `数据库测试失败: ${dbError instanceof Error ? dbError.message : String(dbError)}`,
        }));
      }
    } catch (error) {
      console.error('测试过程出错:', error);
      setTestResults({
        sdk: false,
        auth: false,
        db: false,
        message: `测试失败: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">腾讯云开发连接测试</h2>
      
      <button
        onClick={runTest}
        className="mb-4 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        运行测试
      </button>
      
      <div className="space-y-2">
        <div className="flex items-center">
          <span className={`inline-block w-4 h-4 rounded-full mr-2 ${testResults.sdk ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span>SDK初始化: {testResults.sdk ? '成功' : '失败'}</span>
        </div>
        
        <div className="flex items-center">
          <span className={`inline-block w-4 h-4 rounded-full mr-2 ${testResults.auth ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span>认证: {testResults.auth ? '成功' : '失败'}</span>
        </div>
        
        <div className="flex items-center">
          <span className={`inline-block w-4 h-4 rounded-full mr-2 ${testResults.db ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span>数据库: {testResults.db ? '成功' : '失败'}</span>
        </div>
      </div>
      
      {testResults.message && (
        <div className={`mt-4 p-3 rounded ${testResults.sdk && testResults.auth && testResults.db ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {testResults.message}
        </div>
      )}
    </div>
  );
} 

