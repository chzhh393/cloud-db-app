'use client';

import { useState, useEffect } from 'react';
import { getCloudbaseApp, getAuth } from '../lib/cloudbase';

export default function CloudStatus() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'auth_failed' | 'init_failed' | 'disconnected'>('loading');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const checkCloudConnection = async () => {
      try {
        const app = getCloudbaseApp();
        if (!app) {
          setStatus('init_failed');
          return;
        }
        
        // 检查认证状态
        const auth = await getAuth();
        if (!auth) {
          setStatus('auth_failed');
          return;
        }
        
        setStatus('connected');
      } catch (error) {
        console.error('检查云连接状态失败:', error);
        setStatus('disconnected');
      }
    };

    checkCloudConnection();
  }, []);

  if (!mounted) return null;

  const getStatusInfo = () => {
    switch(status) {
      case 'loading':
        return {
          className: "fixed bottom-4 right-4 bg-gray-100 px-3 py-2 rounded-md shadow-md text-sm",
          text: "正在检查云连接..."
        };
      case 'init_failed':
        return {
          className: "fixed bottom-4 right-4 bg-orange-100 text-orange-700 px-3 py-2 rounded-md shadow-md text-sm",
          text: "云初始化失败 - SDK初始化错误"
        };
      case 'auth_failed':
        return {
          className: "fixed bottom-4 right-4 bg-yellow-100 text-yellow-700 px-3 py-2 rounded-md shadow-md text-sm",
          text: "云认证失败 - 请检查权限设置"
        };
      case 'disconnected':
        return {
          className: "fixed bottom-4 right-4 bg-red-100 text-red-700 px-3 py-2 rounded-md shadow-md text-sm",
          text: "云连接失败 - 请检查网络和环境ID"
        };
      case 'connected':
        return {
          className: "fixed bottom-4 right-4 bg-green-100 text-green-700 px-3 py-2 rounded-md shadow-md text-sm",
          text: "已连接到腾讯云开发"
        };
      default:
        return {
          className: "fixed bottom-4 right-4 bg-gray-100 px-3 py-2 rounded-md shadow-md text-sm",
          text: "云连接状态未知"
        };
    }
  };

  const statusInfo = getStatusInfo();
  
  return (
    <div className={statusInfo.className}>
      {statusInfo.text}
    </div>
  );
}

