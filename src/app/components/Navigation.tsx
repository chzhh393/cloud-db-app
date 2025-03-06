'use client';

import Link from 'next/link';

export default function Navigation() {
  return (
    <div className="bg-white shadow-sm py-4">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">腾讯云开发任务管理</h1>
          
          <div className="flex space-x-2">
            {/* 只保留导入数学题目按钮 */}
            <Link 
              href="/import-math" 
              className="py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              导入数学题目
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 

