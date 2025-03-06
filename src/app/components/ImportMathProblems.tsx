'use client';

import { useState } from 'react';
import { getCloudBaseClient } from '../lib/cloudbase-client';
import Link from 'next/link';

// 数学题目导入组件
export default function ImportMathProblems() {
  const [userId, setUserId] = useState<string>('user001'); // 默认值方便测试
  const [jsonContent, setJsonContent] = useState<string>('');
  const [taskTitle, setTaskTitle] = useState<string>('数学题集');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    taskId?: string;
    problemCount?: number;
    previewData?: any;
  } | null>(null);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [parsedData, setParsedData] = useState<Record<string, string> | null>(null);

  // 解析JSON内容
  const parseJsonContent = () => {
    try {
      // 尝试解析JSON
      let parsedJson: Record<string, string>;
      
      try {
        parsedJson = JSON.parse(jsonContent);
      } catch (error) {
        // JSON格式错误
        setResult({
          success: false,
          message: 'JSON格式不正确，请检查格式'
        });
        console.error('JSON解析错误:', error);
        return;
      }
      
      // 验证是否包含content开头的键
      const contentKeys = Object.keys(parsedJson).filter(key => key.startsWith('content'));
      if (contentKeys.length === 0) {
        setResult({
          success: false,
          message: '未找到题目内容，请确保JSON包含content开头的键'
        });
        return;
      }
      
      // 设置解析结果
      setParsedData(parsedJson);
      setPreviewMode(true);
      setResult({
        success: true,
        message: `成功解析 ${contentKeys.length} 个题目`,
        previewData: parsedJson
      });
      
      console.log('解析的题目:', parsedJson);
    } catch (error) {
      setResult({
        success: false,
        message: `解析失败: ${error instanceof Error ? error.message : '未知错误'}`
      });
      console.error('解析失败:', error);
    }
  };

  // 预览题目
  const handlePreview = () => {
    parseJsonContent();
  };

  // 导入题目到数据库
  const handleImport = async () => {
    if (!userId.trim()) {
      setResult({
        success: false,
        message: '请输入用户ID'
      });
      return;
    }
    
    if (!parsedData) {
      setResult({
        success: false,
        message: '请先解析题目'
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const app = await getCloudBaseClient();
      if (!app) {
        throw new Error('云开发客户端初始化失败');
      }
      
      const db = app.database();
      
      // 创建新任务
      const taskId = `task_${Date.now()}`;
      const task = {
        task_id: taskId,
        title: taskTitle || `数学题集 (${Object.keys(parsedData).filter(k => k.startsWith('content')).length}题)`,
        user_id: userId,
        conversation_id: `conv_${Date.now()}`,
        status: '未开始',
        created_at: new Date(),
      };
      
      // 创建任务记录
      await db.collection('ai_tasks').add(task);
      
      // 创建题目记录
      const contentKeys = Object.keys(parsedData).filter(key => key.startsWith('content'));
      const problems = [];
      
      for (const key of contentKeys) {
        const problem = {
          task_id: taskId,
          problem_key: key,
          content: parsedData[key],
          answered: false,
          created_at: new Date(),
        };
        
        problems.push(problem);
      }
      
      // 批量添加题目
      for (const problem of problems) {
        await db.collection('ai_problems').add(problem);
      }
      
      setResult({
        success: true,
        message: `成功导入任务和${problems.length}个题目`,
        taskId: taskId,
        problemCount: problems.length
      });
      
      // 重置表单
      setJsonContent('');
      setPreviewMode(false);
      setParsedData(null);
      
    } catch (error) {
      setResult({
        success: false,
        message: `导入失败: ${error instanceof Error ? error.message : '未知错误'}`
      });
      console.error('导入失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">导入数学题目</h2>
      
      {!previewMode ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              用户ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="输入用户ID"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              任务标题
            </label>
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="输入任务标题"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              JSON格式题目内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={jsonContent}
              onChange={(e) => setJsonContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono"
              rows={10}
              placeholder={`{\n  "content1": "题目1内容",\n  "content2": "题目2内容"\n}`}
            ></textarea>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setJsonContent(`{
  "content1": "某家电商场计划用9万元从生产厂家家购进50台电视机.已知该厂家生产三种不同型号的电视机，出厂价分别为：甲种每台1500元，乙种每台2100元，丙种每台2500元.\\n(1)若该家电商场同时购进两种不同型号的电视机共50台，用去9万元，请你研究一下商场的进货方案；\\n(2)若该商场销售一台甲种电视机可获利150元，销售一台乙种电视机可获利200元，销售一台丙种电视机可获利250元，在(1)的方案中，为了使销售时获利最多，你选择哪种进货方案？",
  "content2": "点P从点A出发，以2个单位/秒的速度沿着"坡数轴"向右运动。同时点Q从点B出发，以每秒1个单位的速度沿着"坡数轴"向左运动。经过多久，PQ=2？"
}`);
              }}
              className="py-2 px-4 bg-gray-600 text-white rounded-md"
            >
              示例1
            </button>
            
            <button
              onClick={() => {
                setJsonContent(`{
  "content1": "5 反 比 例\\n第1关 练速度\\n1. 把相同体积的水倒入底面积不同的杯子。\\n\\n| 水的高度/cm | 30 | 24 | 18 | 9 | ... |\\n|---|---|---|---|---|---|\\n| 杯子的底面积/cm² | 12 | 15 | 20 | 40 | ... |\\n\\n(1) 表中（    ）和（    ）是两个相关联的量，这两个量的（    ）一定，成（    ）比例。\\n(2) 当水的高度是15 cm时，杯子的底面积是（    ）cm²；当杯子的底面积是50 cm²时，水的高度是（    ）cm。",
  "content2": "2. 下列各题中的两种量，成正比例关系的填"正"，成反比例关系的填"反"，不成比例关系的填"不成"。\\n(1) 看一本书，已看的页数和未看的页数。（    ）\\n(2) 总产量一定，每公顷的产量和公顷数。（    ）\\n(3) 一个水池，水管每小时注水量和注满水池所用时间。（    ）\\n(4) 圆的周长一定，圆周率和直径。（    ）\\n(5) 20÷a=b(a不等于0)，a和b。（    ）"
}`);
              }}
              className="py-2 px-4 bg-gray-600 text-white rounded-md"
            >
              示例2
            </button>
            
            <button
              onClick={() => {
                // 尝试修复JSON格式
                let fixed = jsonContent.trim();
                if (!fixed.startsWith('{')) fixed = '{' + fixed;
                if (!fixed.endsWith('}')) fixed = fixed + '}';
                // 处理LaTex表达式
                fixed = fixed.replace(/\\\[/g, '\\\\[');
                fixed = fixed.replace(/\\\]/g, '\\\\]');
                // 尝试修复未转义的反斜杠
                fixed = fixed.replace(/(?<!\\)\\(?![\\"])/g, '\\\\');
                setJsonContent(fixed);
              }}
              className="py-2 px-4 bg-yellow-600 text-white rounded-md"
            >
              尝试修复JSON
            </button>
            
            <button
              onClick={handlePreview}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md"
              disabled={loading}
            >
              {loading ? '处理中...' : '解析JSON'}
            </button>
          </div>
          
          {result && (
            <div className={`p-4 rounded ${result.success ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
              <p className={result.success ? 'text-green-700' : 'text-red-700'}>
                {result.message}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">
            已解析 {parsedData ? Object.keys(parsedData).filter(k => k.startsWith('content')).length : 0} 个题目
          </h3>
          
          <div className="border border-gray-200 rounded-md p-4 max-h-64 overflow-y-auto">
            {parsedData && Object.keys(parsedData)
              .filter(key => key.startsWith('content'))
              .sort((a, b) => {
                const numA = parseInt(a.replace('content', ''));
                const numB = parseInt(b.replace('content', ''));
                return numA - numB;
              })
              .map((key) => (
                <div key={key} className="mb-4 pb-4 border-b border-gray-200 last:border-0">
                  <h4 className="font-medium text-gray-700 mb-1">{key}</h4>
                  <pre className="whitespace-pre-wrap bg-gray-50 p-2 rounded text-sm">
                    {parsedData[key]}
                  </pre>
                </div>
              ))}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setPreviewMode(false);
                setResult(null);
              }}
              className="py-2 px-4 bg-gray-600 text-white rounded-md"
            >
              返回编辑
            </button>
            
            <button
              onClick={handleImport}
              className="flex-1 py-2 px-4 bg-green-600 text-white rounded-md"
              disabled={loading}
            >
              {loading ? '导入中...' : '确认导入'}
            </button>
          </div>
          
          {result && (
            <div className={`p-4 rounded ${result.success ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
              <p className={result.success ? 'text-green-700' : 'text-red-700'}>
                {result.message}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 

