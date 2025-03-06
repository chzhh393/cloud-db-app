import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { aiTasksService } from '../../lib/cloudbase';

// 云开发初始化配置
const ENV_ID = 'dev-8grd339lb1d943ec';

// 在服务器端安全地初始化SDK
const initServerSDK = () => {
  try {
    // 这是一个简化的示例，实际使用中应该使用服务端SDK
    const app = cloudbase.init({
      env: ENV_ID,
    });
    return app;
  } catch (error) {
    console.error('初始化SDK失败:', error);
    return null;
  }
};

// 创建问题记录
export async function POST(request: Request) {
  try {
    const problem = await request.json();
    
    // 验证必要字段
    if (!problem || !problem.task_id || !problem.content) {
      return NextResponse.json(
        { error: '缺少必要的问题数据' },
        { status: 400 }
      );
    }
    
    console.log('创建问题数据:', problem);
    
    // 使用aiTasksService创建问题
    try {
      const result = await aiTasksService.createProblem(problem);
      return NextResponse.json({ success: true, id: result.id });
    } catch (error) {
      console.error('创建问题失败:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : '创建问题失败' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('处理请求失败:', error);
    return NextResponse.json(
      { error: '处理请求失败' },
      { status: 500 }
    );
  }
} 

