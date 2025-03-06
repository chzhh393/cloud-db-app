'use client';

import { useState, useEffect } from 'react';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';
import CloudTest from './components/CDNTest';
import AuthTest from './components/AuthTest';
import ImportProblems from './components/ImportProblems';
import { AITask } from './lib/types';
import { aiTasksService } from './lib/cloudbase';
import Link from 'next/link';

export default function Home() {
  const [tasks, setTasks] = useState<AITask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [showAuthTest, setShowAuthTest] = useState(false);
  const [showCDNTest, setShowCDNTest] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [dataDebug, setDataDebug] = useState<string | null>(null);

  // 获取任务列表
  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    setDataDebug(null);

    try {
      // 直接使用cloudbase服务
      const data = await aiTasksService.getTasks();
      
      // 调试信息
      console.log('获取到的任务数据:', data);
      setDataDebug(JSON.stringify(data, null, 2));
      
      // 确保data是数组
      if (Array.isArray(data)) {
        setTasks(data);
      } else if (data && typeof data === 'object') {
        // 如果data是对象但不是数组，尝试找到可能的数组属性
        const possibleArrays = Object.values(data).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
          setTasks(possibleArrays[0] as AITask[]);
        } else {
          console.error('数据不是数组格式:', data);
          setTasks([]);
        }
      } else {
        console.error('无效的数据格式:', data);
        setTasks([]);
      }
    } catch (err) {
      console.error('获取任务列表失败:', err);
      setError(err instanceof Error ? err.message : '获取任务列表失败');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // 创建任务
  const createTask = async (taskData: AITask) => {
    try {
      // 直接使用cloudbase服务
      await aiTasksService.createTask(taskData);
      
      // 刷新任务列表
      await fetchTasks();
      setShowForm(false);
    } catch (err) {
      console.error('创建任务失败:', err);
      throw err;
    }
  };

  // 删除任务
  const deleteTask = async (id: string) => {
    try {
      // 直接使用cloudbase服务
      await aiTasksService.deleteTask(id);

      // 从列表中移除删除的任务
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
    } catch (err) {
      console.error('删除任务失败:', err);
      throw err;
    }
  };

  // 初始加载获取任务列表
  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">腾讯云开发任务管理</h1>
          <div className="flex space-x-2">
            <Link href="/import-math" className="py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700">
              导入数学题目
            </Link>
          </div>
        </header>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {showCDNTest && (
          <div className="mb-6">
            <CloudTest />
          </div>
        )}

        {showAuthTest && (
          <div className="mb-6">
            <AuthTest />
          </div>
        )}

        {showTest && (
          <div className="mb-6">
            <CloudTest />
          </div>
        )}

        {showImport && (
          <div className="mb-6">
            <ImportProblems />
          </div>
        )}

        {showForm && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">新建任务</h2>
            <TaskForm onSubmit={createTask} buttonText="创建任务" />
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">任务列表</h2>
            <button
              onClick={fetchTasks}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none"
            >
              刷新
            </button>
          </div>
          
          {loading ? (
            <div className="text-center py-10">
              <p className="text-gray-500">加载中...</p>
            </div>
          ) : (
            <>
              <TaskList tasks={tasks} onDelete={deleteTask} />
              
              {dataDebug && (
                <div className="mt-6 p-4 bg-gray-100 rounded-md">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">调试信息 (原始数据):</h3>
                  <pre className="text-xs overflow-auto max-h-40 p-2 bg-white rounded">
                    {dataDebug}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

