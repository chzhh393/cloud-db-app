'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TaskForm from '@/app/components/TaskForm';
import { AITask } from '@/app/lib/types';
import { aiTasksService } from '@/app/lib/cloudbase';

interface PageProps {
  params: {
    id: string;
  };
}

export default function TaskDetail({ params }: PageProps) {
  const { id } = params;
  const router = useRouter();
  
  const [task, setTask] = useState<AITask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  // 获取任务详情
  const fetchTask = async () => {
    setLoading(true);
    setError(null);

    try {
      // 直接使用cloudbase服务
      const data = await aiTasksService.getTaskById(id);
      if (!data) {
        throw new Error('任务不存在');
      }
      
      setTask(data);
    } catch (err) {
      console.error('获取任务详情失败:', err);
      setError(err instanceof Error ? err.message : '获取任务详情失败');
    } finally {
      setLoading(false);
    }
  };

  // 更新任务
  const updateTask = async (taskData: AITask) => {
    try {
      // 直接使用cloudbase服务
      await aiTasksService.updateTask(id, taskData);

      // 刷新任务详情
      await fetchTask();
      setEditing(false);
    } catch (err) {
      console.error('更新任务失败:', err);
      throw err;
    }
  };

  // 删除任务
  const deleteTask = async () => {
    if (!confirm('确定要删除这个任务吗？')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 直接使用cloudbase服务
      await aiTasksService.deleteTask(id);

      // 删除成功后返回首页
      router.push('/');
    } catch (err) {
      console.error('删除任务失败:', err);
      setError(err instanceof Error ? err.message : '删除任务失败');
      setLoading(false);
    }
  };

  // 获取状态样式
  const getStatusClasses = (status: string) => {
    switch(status) {
      case '进行中': return 'bg-blue-100 text-blue-800';
      case '已完成': return 'bg-green-100 text-green-800';
      case '已取消': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 初始加载获取任务详情
  useEffect(() => {
    fetchTask();
  }, [id]);

  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link 
            href="/"
            className="text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"></path>
            </svg>
            返回任务列表
          </Link>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-10">
            <p className="text-gray-500">加载中...</p>
          </div>
        ) : task ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                {editing ? '编辑任务' : '任务详情'}
              </h1>
              <div className="flex space-x-2">
                {!editing && (
                  <>
                    <button
                      onClick={() => setEditing(true)}
                      className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    >
                      编辑
                    </button>
                    <button
                      onClick={deleteTask}
                      className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                    >
                      删除
                    </button>
                  </>
                )}
                {editing && (
                  <button
                    onClick={() => setEditing(false)}
                    className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
                  >
                    取消
                  </button>
                )}
              </div>
            </div>

            {editing ? (
              <TaskForm
                onSubmit={updateTask}
                initialData={task}
                buttonText="保存更改"
              />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border-b pb-2">
                    <p className="text-sm text-gray-500">任务ID</p>
                    <p className="text-gray-900 font-medium">{task.task_id}</p>
                  </div>
                  <div className="border-b pb-2">
                    <p className="text-sm text-gray-500">用户ID</p>
                    <p className="text-gray-900 font-medium">{task.user_id}</p>
                  </div>
                </div>
                <div className="border-b pb-2">
                  <p className="text-sm text-gray-500">任务标题</p>
                  <p className="text-gray-900 font-medium">{task.title}</p>
                </div>
                <div className="border-b pb-2">
                  <p className="text-sm text-gray-500">对话ID</p>
                  <p className="text-gray-900 font-medium">{task.conversation_id}</p>
                </div>
                <div className="border-b pb-2">
                  <p className="text-sm text-gray-500">状态</p>
                  <p className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusClasses(task.status)}`}>
                    {task.status}
                  </p>
                </div>
                {task.created_at && (
                  <div className="border-b pb-2">
                    <p className="text-sm text-gray-500">创建时间</p>
                    <p className="text-gray-900 font-medium">
                      {new Date(task.created_at).toLocaleString()}
                    </p>
                  </div>
                )}
                {task.updated_at && (
                  <div className="border-b pb-2">
                    <p className="text-sm text-gray-500">最后更新时间</p>
                    <p className="text-gray-900 font-medium">
                      {new Date(task.updated_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500">任务不存在</p>
          </div>
        )}
      </div>
    </main>
  );
}

