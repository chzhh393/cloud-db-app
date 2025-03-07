'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 重定向到import-math路由
export default function ImportRedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/import-math');
  }, [router]);

  return (
    <div className="container mx-auto py-6 px-4 text-center">
      <p className="text-lg">正在重定向到数学题目导入页面...</p>
    </div>
  );
} 

