import { NextRequest, NextResponse } from 'next/server';

// 由于腾讯云SDK限制，API路由不再使用
// 所有操作已移至客户端组件直接调用

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      success: false, 
      message: 'API路由不再使用，请在客户端组件中直接调用腾讯云SDK' 
    },
    { status: 400 }
  );
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      success: false, 
      message: 'API路由不再使用，请在客户端组件中直接调用腾讯云SDK' 
    },
    { status: 400 }
  );
} 

