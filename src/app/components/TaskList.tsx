'use client';

import { useState } from 'react';
import { AITask } from '../lib/types';
import Link from 'next/link';

interface TaskListProps {
  tasks: AITask[];
  onDelete?: (id: string) => Promise<void>;
}

export default function TaskList({ tasks = [], onDelete }: TaskListProps) {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  // 确保tasks是数组
  const taskArray = Array.isArray(tasks) ? tasks : [];

  const handleDelete = async (id: string | undefined) => {
    if (!id || !onDelete) return;
    
    setLoading((prev) => ({ ...prev, [id]: true }));
    setError(null);
    
    try {
      await onDelete(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    } finally {
      setLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  if (taskArray.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">暂无任务数据</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case '进行中': return 'bg-blue-100 text-blue-800';
      case '已完成': return 'bg-green-100 text-green-800';
      case '已取消': return 'bg-red-100 text-red-800';
      case '未开始': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="overflow-x-auto">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <table className="min-w-full bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              任务ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              标题
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              用户ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              状态
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              操作
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {taskArray.map((task) => (
            <tr key={task.id || task.task_id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {task.task_id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {task.title}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {task.user_id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <Link 
                    href={`/tasks/${task.id}`}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    查看
                  </Link>
                  {onDelete && (
                    <button
                      onClick={() => handleDelete(task.id)}
                      disabled={loading[task.id || '']}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      {loading[task.id || ''] ? '删除中...' : '删除'}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 

