import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ClientWrapper from "./components/ClientWrapper";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "腾讯云开发任务管理",
  description: "使用Next.js开发的腾讯云开发平台数据表操作Web应用",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <ClientWrapper />
        
        {/* 腾讯云开发SDK脚本 - 使用官方推荐的CDN方式 */}
        <Script
          src="https://static.cloudbase.net/cloudbase-js-sdk/2.7.12-beta.0/cloudbase.full.js"
          strategy="beforeInteractive"
        />
        <Script id="cloudbase-init">
          {`
            if (typeof window !== 'undefined' && window.cloudbase) {
              try {
                // 严格按照官方文档初始化
                const app = window.cloudbase.init({
                  env: 'dev-8grd339lb1d943ec',
                  region: 'ap-shanghai' // 明确指定地域，避免地域不匹配问题
                });
                
                // 保存app实例到全局变量
                window.tcbApp = app;
                console.log('腾讯云开发SDK初始化成功(CDN方式)');
                
                // 获取auth对象
                const auth = app.auth({
                  persistence: "local" // 持久化存储登录态
                });
                
                // 保存auth对象到全局变量
                window.tcbAuth = auth;
                
                // 检查是否已登录
                auth.getLoginState().then(loginState => {
                  if (loginState) {
                    console.log('已有登录状态，用户ID:', loginState.user?.uid);
                    window.tcbLoginState = loginState;
                  } else {
                    console.log('无登录状态，尝试匿名登录...');
                    // 进行匿名登录
                    auth.signInAnonymously().then(res => {
                      console.log('匿名登录成功:', res);
                      window.tcbLoginState = res;
                    }).catch(err => {
                      console.error('匿名登录失败:', err);
                      // 输出详细错误信息
                      if (err && err.code) {
                        console.error('错误代码:', err.code);
                      }
                      if (err && err.message) {
                        console.error('错误信息:', err.message);
                      }
                    });
                  }
                }).catch(err => {
                  console.error('获取登录状态失败:', err);
                  // 输出详细错误信息
                  if (err && err.code) {
                    console.error('错误代码:', err.code);
                  }
                  if (err && err.message) {
                    console.error('错误信息:', err.message);
                  }
                });
              } catch (error) {
                console.error('腾讯云开发SDK初始化失败(CDN方式):', error);
              }
            }
          `}
        </Script>
      </body>
    </html>
  );
}

function MainNavigation() {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">腾讯云开发任务管理</h1>
      
      <div className="flex space-x-2">
        {/* 只保留导入数学题目按钮，移除其他所有按钮 */}
        <Link href="/import-math" className="py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700">
          导入数学题目
        </Link>
      </div>
    </div>
  );
}

