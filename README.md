# 腾讯云开发平台数据表操作Web应用

这是一个使用Next.js开发的Web应用，用于访问腾讯云开发平台的数据表并进行读写操作。该应用可以部署到Vercel上。

## 功能特性

- 连接腾讯云开发平台
- 查看任务列表
- 创建新任务
- 查看任务详情
- 编辑任务信息
- 删除任务

## 技术栈

- [Next.js](https://nextjs.org/) - React框架
- [Tailwind CSS](https://tailwindcss.com/) - 样式框架
- [@cloudbase/js-sdk](https://docs.cloudbase.net/api-reference/web/initialization) - 腾讯云开发SDK

## 快速开始

### 前提条件

- Node.js 16.x 或更高版本
- 腾讯云开发环境ID (在代码中已配置为 "dev-8grd339lb1d943ec")

### 安装

1. 克隆项目

```bash
git clone <仓库地址>
cd cloud-db-app
```

2. 安装依赖

```bash
npm install
```

3. 运行开发服务器

```bash
npm run dev
```

4. 浏览器访问 [http://localhost:3000](http://localhost:3000)

## 注意事项

### 客户端限制

腾讯云开发SDK（@cloudbase/js-sdk）设计为在浏览器环境中运行，因此：

- 所有云数据操作仅在客户端（浏览器）中进行
- 应用使用客户端组件（'use client'）直接与云开发平台交互
- API路由不用于数据操作，避免在服务器端使用SDK
- 界面右下角有连接状态指示器显示云连接状态

这种设计确保了应用可以在Next.js中正常运行，同时充分利用腾讯云开发平台的客户端SDK功能。

## 部署到Vercel

1. 将代码推送到GitHub仓库

2. 在Vercel上导入项目
   - 访问 [Vercel](https://vercel.com)
   - 点击 "New Project"
   - 选择GitHub仓库
   - 点击 "Import"
   - 配置环境变量（如果需要）
   - 点击 "Deploy"

## 项目结构

```
cloud-db-app/
├── src/
│   ├── app/
│   │   ├── api/               # 后端API接口（不再使用）
│   │   ├── components/        # 前端组件
│   │   │   ├── TaskForm.tsx   # 任务表单组件
│   │   │   ├── TaskList.tsx   # 任务列表组件
│   │   │   └── CloudStatus.tsx# 云连接状态组件
│   │   ├── lib/               # 工具库
│   │   │   ├── cloudbase.ts   # 腾讯云开发SDK封装
│   │   │   └── types.ts       # 类型定义
│   │   ├── tasks/             # 任务页面
│   │   │   └── [id]/          # 任务详情页
│   │   │       └── page.tsx
│   │   ├── globals.css        # 全局样式
│   │   ├── layout.tsx         # 布局组件
│   │   ├── providers.tsx      # 客户端提供者
│   │   └── page.tsx           # 首页
├── public/                    # 静态资源
├── package.json
├── vercel.json                # Vercel配置
└── README.md
```

## 开发说明

### 云开发环境配置

在 `src/app/lib/cloudbase.ts` 中修改云开发环境ID：

```typescript
export const getCloudbaseApp = () => {
  if (!isClient) {
    console.error('Cloudbase SDK 只能在客户端环境中使用');
    return null;
  }
  
  const app = cloudbase.init({
    env: "你的环境ID", // 替换为你的云开发环境 ID
    clientId: "你的环境ID", // 替换为你的云开发环境 ID
  });
  return app;
};
```

### 数据模型

应用使用了以下数据模型：

```typescript
export interface AITask {
  id?: string;
  task_id: string;
  title: string;
  user_id: string;
  conversation_id: string;
  status: string;
  created_at?: Date;
  updated_at?: Date;
}
```

## License

MIT

# cloud-db-app
