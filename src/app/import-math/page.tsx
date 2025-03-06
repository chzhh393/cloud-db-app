'use client';

import { useEffect, useState } from 'react';
import ImportMathProblems from '../components/ImportMathProblems';
import Link from 'next/link';
import { getAuthClient } from '../lib/cloudbase-client';

export default function ImportMathPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const auth = await getAuthClient();
        setIsAuthenticated(!!auth);
      } catch (error) {
        console.error('认证检查失败:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    }
    
    checkAuth();
  }, []);

  return (
    <div className="container mx-auto py-6 px-4">
      {/* 顶部导航 - 简洁版 */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">腾讯云开发任务管理</h1>
        
        <div className="flex space-x-2">
          <Link href="/import-math" className="py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700">
            导入数学题目
          </Link>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-10">
          <p className="text-lg">正在检查认证状态...</p>
        </div>
      ) : !isAuthenticated ? (
        <div className="text-center py-10">
          <p className="text-lg text-red-600 mb-4">未认证，请先登录</p>
          <Link href="/" className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            返回首页
          </Link>
        </div>
      ) : (
        <ImportMathProblems />
      )}
    </div>
  );
} 

