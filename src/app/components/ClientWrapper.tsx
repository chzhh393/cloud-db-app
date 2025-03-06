'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// 动态导入ClientProviders组件，确保只在客户端渲染
const ClientProviders = dynamic(() => import('../providers'), {
  ssr: false,
});

export default function ClientWrapper() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;
  
  return (
    <>
      <ClientProviders />
      <div className="flex space-x-2">
        <Link href="/import-math" className="py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700">
          导入数学题目
        </Link>
      </div>
    </>
  );
} 

