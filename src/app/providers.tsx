'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// 动态导入CloudStatus组件，确保只在客户端加载
const CloudStatus = dynamic(() => import('./components/CloudStatus'), {
  ssr: false,
});

export default function ClientProviders() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;
  
  return (
    <>
      <CloudStatus />
    </>
  );
} 

