// 定义任务类型
export interface AITask {
  id?: string;
  task_id: string;  // 任务唯一标识符
  title: string;    // 任务标题
  user_id: string;  // 关联的用户ID
  conversation_id: string;  // 与AI的会话ID
  status: string;   // 任务状态
  created_at?: Date | string;  // 创建时间
  updated_at?: Date | string;  // 更新时间
}

// 定义过滤器类型
export interface TaskFilter {
  id?: string;
  task_id?: string;
  user_id?: string;
  status?: string;
  conversation_id?: string;
}

// 定义用户类型 (根据文档示例)
export interface AIUser {
  id?: string;
  user_type: string;  // 用户类型
  avatar_url: string; // 头像URL
  open_id: string;    // 微信用户唯一标识
  nickname: string;   // 用户昵称
  created_at?: Date | string;  // 创建时间
  updated_at?: Date | string;  // 更新时间
} 

