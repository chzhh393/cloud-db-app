'use client';

import { useState } from 'react';
import { getCloudbaseApp, getAuth, getModels } from '../lib/cloudbase';

export default function CloudTest() {
  const [testResults, setTestResults] = useState<{
    app: boolean | null;
    auth: boolean | null;
    models: boolean | null;
    tables: string[] | null;
  }>({
    app: null,
    auth: null,
    models: null,
    tables: null,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTests = async () => {
    setLoading(true);
    setError(null);
    const results = {
      app: false,
      auth: false,
      models: false,
      tables: null as string[] | null,
    };

    try {
      // 测试初始化
      const app = getCloudbaseApp();
      results.app = !!app;
      console.log('App初始化结果:', app);

      if (app) {
        // 测试认证
        const auth = await getAuth();
        results.auth = !!auth;
        console.log('Auth认证结果:', auth);

        // 测试获取models
        const models = await getModels();
        results.models = !!models;
        console.log('Models获取结果:', models);

        // 尝试获取可用的数据表
        if (models) {
          try {
            // 这里可能需要根据实际SDK调整
            const tables = Object.keys(models);
            results.tables = tables;
            console.log('可用数据表:', tables);
          } catch (e) {
            console.error('获取数据表失败:', e);
          }
        }
      }
    } catch (err) {
      console.error('测试过程出错:', err);
      setError(err instanceof Error ? err.message : '测试过程出错');
    } finally {
      setTestResults(results);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">云开发连接测试</h2>
      
      <button
        onClick={runTests}
        disabled={loading}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {loading ? '测试中...' : '运行测试'}
      </button>
      
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <div className="space-y-2">
        <div className="flex items-center">
          <span className="w-32">SDK初始化:</span>
          <StatusIndicator status={testResults.app} />
        </div>
        
        <div className="flex items-center">
          <span className="w-32">认证状态:</span>
          <StatusIndicator status={testResults.auth} />
        </div>
        
        <div className="flex items-center">
          <span className="w-32">Models获取:</span>
          <StatusIndicator status={testResults.models} />
        </div>
        
        {testResults.tables && (
          <div>
            <span className="block mb-1">可用数据表:</span>
            <ul className="list-disc pl-5">
              {testResults.tables.length > 0 ? (
                testResults.tables.map((table, index) => (
                  <li key={index} className="text-sm">{table}</li>
                ))
              ) : (
                <li className="text-sm text-gray-500">未找到数据表</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusIndicator({ status }: { status: boolean | null }) {
  if (status === null) {
    return <span className="text-gray-500">未测试</span>;
  }
  
  if (status) {
    return <span className="text-green-600">✓ 成功</span>;
  }
  
  return <span className="text-red-600">✗ 失败</span>;
} 

