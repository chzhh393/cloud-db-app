'use client';

import { useState } from 'react';
import { AITask } from '../lib/types';

interface TaskFormProps {
  onSubmit: (task: AITask) => Promise<void>;
  initialData?: Partial<AITask>;
  buttonText?: string;
}

export default function TaskForm({ onSubmit, initialData = {}, buttonText = '提交' }: TaskFormProps) {
  const [task, setTask] = useState<Partial<AITask>>({
    task_id: initialData.task_id || '',
    title: initialData.title || '',
    user_id: initialData.user_id || '',
    conversation_id: initialData.conversation_id || '',
    status: initialData.status || '进行中',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTask((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit(task as AITask);
      // 如果是创建新任务，则清空表单
      if (!initialData.id) {
        setTask({
          task_id: '',
          title: '',
          user_id: '',
          conversation_id: '',
          status: '进行中',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-md">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="task_id" className="block text-sm font-medium text-gray-700">
          任务ID
        </label>
        <input
          type="text"
          id="task_id"
          name="task_id"
          value={task.task_id}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          任务标题
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={task.title}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="user_id" className="block text-sm font-medium text-gray-700">
          用户ID
        </label>
        <input
          type="text"
          id="user_id"
          name="user_id"
          value={task.user_id}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="conversation_id" className="block text-sm font-medium text-gray-700">
          对话ID
        </label>
        <input
          type="text"
          id="conversation_id"
          name="conversation_id"
          value={task.conversation_id}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
          状态
        </label>
        <select
          id="status"
          name="status"
          value={task.status}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="进行中">进行中</option>
          <option value="已完成">已完成</option>
          <option value="已取消">已取消</option>
        </select>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? '提交中...' : buttonText}
        </button>
      </div>
    </form>
  );
} 

