'use client';

import { useState, useEffect } from 'react';
import { aiTasksService } from '../lib/cloudbase';
import Link from 'next/link';

export default function ImportProblems() {
  const [userId, setUserId] = useState<string>('user001');  // 设置默认值方便测试
  const [jsonContent, setJsonContent] = useState<string>('');
  const [taskTitle, setTaskTitle] = useState<string>('数学题集');
  const [loading, setLoading] = useState<boolean>(false);
  const [parsedProblems, setParsedProblems] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string>('');

  // 添加调试函数
  const logDebug = (message: string, data?: any) => {
    console.log(`[调试] ${message}`, data);
    setDebugInfo(prev => prev + `\n[调试] ${message}` + (data ? `: ${JSON.stringify(data).substring(0, 100)}...` : ''));
  };

  // 字符级检查JSON格式
  const checkJsonFormat = (json: string) => {
    logDebug('开始字符级检查JSON格式');
    
    // 去除前后空白
    const trimmed = json.trim();
    logDebug(`JSON长度: ${trimmed.length}字符`);
    
    // 检查基本格式
    if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
      const startChar = trimmed.charAt(0);
      const endChar = trimmed.charAt(trimmed.length - 1);
      logDebug(`格式错误: 应该以{开始和}结束，实际是以${startChar}开始和${endChar}结束`);
      return false;
    }
    
    // 检查引号配对
    let insideString = false;
    let escaped = false;
    const problems = [];
    
    for (let i = 0; i < trimmed.length; i++) {
      const char = trimmed[i];
      
      if (escaped) {
        escaped = false;
        continue;
      }
      
      if (char === '\\') {
        escaped = true;
      } else if (char === '"' && !escaped) {
        insideString = !insideString;
      } else if (!insideString) {
        // 不在字符串内时，检查括号和逗号
        if (char === '{' || char === '}' || char === ',') {
          // 这些字符在字符串外是合法的
        } else if (char === ':') {
          // 冒号前应该已结束字符串
        } else if (/\s/.test(char)) {
          // 空白字符是允许的
        } else {
          problems.push({
            position: i,
            char,
            context: trimmed.substring(Math.max(0, i - 10), Math.min(trimmed.length, i + 10))
          });
        }
      }
    }
    
    if (insideString) {
      logDebug('格式错误: 字符串未闭合，缺少结束引号');
      return false;
    }
    
    if (problems.length > 0) {
      logDebug(`发现${problems.length}个潜在问题`, problems);
      return false;
    }
    
    logDebug('基本格式检查通过');
    return true;
  };

  // 预处理JSON内容 - 更全面的预处理
  const preprocessJsonContent = (content: string) => {
    logDebug('开始预处理JSON内容');
    let processed = content.trim();
    
    // 保存原始长度以比较变化
    const originalLength = processed.length;
    
    // 1. 检查并修复JSON开头和结尾
    if (!processed.startsWith('{')) {
      processed = '{' + processed;
      logDebug('添加了缺失的开头大括号');
    }
    
    if (!processed.endsWith('}')) {
      processed = processed + '}';
      logDebug('添加了缺失的结尾大括号');
    }
    
    // 2. 处理数学公式中的特殊字符
    const originalMathCount = (processed.match(/\\\[/g) || []).length;
    
    // 处理LaTeX方括号
    processed = processed.replace(/\\\[/g, '\\\\[');
    processed = processed.replace(/\\\]/g, '\\\\]');
    
    const newMathCount = (processed.match(/\\\\\[/g) || []).length;
    logDebug(`处理了${newMathCount}个LaTeX方括号对`);
    
    // 3. 处理其他转义字符
    const originalBackslashCount = (processed.match(/\\/g) || []).length;
    
    // 替换未转义的反斜杠
    processed = processed.replace(/(?<!\\)\\(?![\\"])/g, '\\\\');
    
    const newBackslashCount = (processed.match(/\\/g) || []).length;
    logDebug(`处理了${newBackslashCount - originalBackslashCount}个反斜杠`);
    
    // 4. 修复可能的JSON语法问题
    // 修复键名未加引号的情况
    processed = processed.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');
    
    // 5. 检查处理后的结果
    logDebug(`预处理前长度: ${originalLength}, 预处理后长度: ${processed.length}`);
    
    return processed;
  };

  // 尝试多种方式解析JSON
  const parseJsonMultipleWays = (content: string) => {
    logDebug('尝试多种方式解析JSON');
    
    // 尝试直接解析
    try {
      logDebug('方法1: 直接解析');
      const parsed = JSON.parse(content);
      logDebug('直接解析成功', Object.keys(parsed));
      return { success: true, data: parsed, method: '直接解析' };
    } catch (error) {
      logDebug(`直接解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
    
    // 尝试预处理后解析
    try {
      logDebug('方法2: 预处理后解析');
      const preprocessed = preprocessJsonContent(content);
      const parsed = JSON.parse(preprocessed);
      logDebug('预处理后解析成功', Object.keys(parsed));
      return { success: true, data: parsed, method: '预处理后解析' };
    } catch (error) {
      logDebug(`预处理后解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
    
    // 尝试使用正则表达式提取
    try {
      logDebug('方法3: 使用正则表达式提取');
      const result: Record<string, string> = {};
      // 匹配 "contentX": "内容" 模式
      const regex = /"content(\d+)"\s*:\s*"([^"]*)"/g;
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        const contentKey = 'content' + match[1];
        const contentValue = match[2];
        result[contentKey] = contentValue;
      }
      
      if (Object.keys(result).length > 0) {
        logDebug('正则表达式提取成功', Object.keys(result));
        return { success: true, data: result, method: '正则表达式提取' };
      } else {
        logDebug('正则表达式未提取到内容');
      }
    } catch (error) {
      logDebug(`正则表达式提取失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
    
    // 尝试修复并解析JSON (最后的尝试)
    try {
      logDebug('方法4: 修复并解析JSON');
      
      // 提取所有可能的键值对
      const keyValuePairs: [string, string][] = [];
      const keyValueRegex = /"content\d+"[^:]*:[^"]*"((?:[^"\\]|\\.)*?)"/g;
      let keyValueMatch;
      
      while ((keyValueMatch = keyValueRegex.exec(content)) !== null) {
        const fullMatch = keyValueMatch[0];
        const keyMatch = /"(content\d+)"/.exec(fullMatch);
        
        if (keyMatch) {
          const key = keyMatch[1];
          const valueMatch = /:[^"]*"((?:[^"\\]|\\.)*?)"/.exec(fullMatch);
          if (valueMatch) {
            const value = valueMatch[1];
            keyValuePairs.push([key, value]);
          }
        }
      }
      
      if (keyValuePairs.length > 0) {
        const constructedObject: Record<string, string> = {};
        keyValuePairs.forEach(([key, value]) => {
          constructedObject[key] = value;
        });
        
        logDebug('修复并提取成功', Object.keys(constructedObject));
        return { success: true, data: constructedObject, method: '修复并提取' };
      } else {
        logDebug('无法提取键值对');
      }
    } catch (error) {
      logDebug(`修复并解析JSON失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
    
    // 所有方式都失败
    return { success: false, error: '尝试多种方式解析都失败' };
  };

  // 解析JSON并提取题目
  const parseJson = () => {
    setDebugInfo(''); // 清除之前的调试信息
    logDebug('开始解析JSON');
    
    if (!jsonContent.trim()) {
      setParseError('请输入内容');
      return;
    }
    
    try {
      // 先做基本格式检查
      checkJsonFormat(jsonContent);
      
      // 尝试多种方式解析
      const parseResult = parseJsonMultipleWays(jsonContent);
      
      if (!parseResult.success) {
        throw new Error(parseResult.error);
      }
      
      // 提取题目
      const jsonData = parseResult.data;
      logDebug(`使用${parseResult.method}成功解析JSON`);
      
      const problems: any[] = [];
      
      // 提取content键值对
      for (const key in jsonData) {
        if (key.startsWith('content')) {
          const index = key.replace('content', '');
          const content = jsonData[key].replace(/\\n/g, '\n').trim();
          
          problems.push({
            index,
            content,
            key
          });
          
          logDebug(`提取题目 ${key}`, {
            contentLength: content.length,
            contentPreview: content.substring(0, 50) + '...'
          });
        }
      }
      
      if (problems.length === 0) {
        throw new Error('未能提取到任何题目，请检查格式');
      }
      
      // 按题号排序
      problems.sort((a, b) => parseInt(a.index) - parseInt(b.index));
      
      logDebug(`共提取到${problems.length}个题目`);
      
      // 设置解析结果
      setParsedProblems(problems);
      setShowPreview(true);
      setParseError('');
      
    } catch (error) {
      console.error('解析JSON出错:', error);
      setParseError('解析JSON出错: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 创建任务
  const handleImport = async () => {
    if (!userId.trim()) {
      setParseError('请输入用户ID');
      return;
    }
    
    if (!parsedProblems || parsedProblems.length === 0) {
      setParseError('请先解析题目');
      return;
    }
    
    setLoading(true);
    logDebug('开始导入题目');
    
    try {
      // 1. 创建任务
      const taskId = `task_${Date.now()}`;
      const task = {
        task_id: taskId,
        title: taskTitle || `导入题目任务 (${parsedProblems.length}题)`,
        user_id: userId,
        conversation_id: `conv_${Date.now()}`,
        status: '未开始'
      };
      
      logDebug('创建任务', task);
      const createdTask = await aiTasksService.createTask(task);
      logDebug('任务创建结果', createdTask);
      
      // 2. 创建问题
      const createdProblems = [];
      
      for (const problem of parsedProblems) {
        const problemData = {
          answered: false,
          problem_key: problem.key || `problem_${problem.index}`,
          task_id: taskId,
          content: problem.content
        };
        
        try {
          logDebug(`创建问题 ${problem.index}`, {
            contentLength: problem.content.length
          });
          const result = await aiTasksService.createProblem(problemData);
          createdProblems.push(result);
          logDebug(`问题 ${problem.index} 创建成功`);
        } catch (err) {
          logDebug(`问题 ${problem.index} 创建失败: ${err instanceof Error ? err.message : '未知错误'}`);
        }
      }
      
      logDebug(`成功创建任务和${createdProblems.length}个问题`);
      setParseError('');
      alert(`成功创建任务和${createdProblems.length}个问题！`);
      
      // 重置状态
      setParsedProblems([]);
      setShowPreview(false);
      setJsonContent('');
    } catch (error) {
      console.error('导入失败:', error);
      setParseError('导入失败: ' + (error instanceof Error ? error.message : '未知错误'));
      logDebug(`导入失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  // 手动修复JSON
  const fixJson = () => {
    logDebug('尝试手动修复JSON');
    let fixed = jsonContent.trim();
    
    // 确保以大括号开始和结束
    if (!fixed.startsWith('{')) fixed = '{' + fixed;
    if (!fixed.endsWith('}')) fixed = fixed + '}';
    
    // 对LaTeX表达式进行双重转义
    fixed = fixed.replace(/\\\[/g, '\\\\[');
    fixed = fixed.replace(/\\\]/g, '\\\\]');
    
    // 尝试确保所有键名都有引号
    fixed = fixed.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');
    
    // 尝试修复未转义的反斜杠
    fixed = fixed.replace(/(?<!\\)\\(?![\\"])/g, '\\\\');
    
    setJsonContent(fixed);
    logDebug('修复后的JSON', { length: fixed.length });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">腾讯云开发任务管理</h1>
        
        <div className="flex space-x-2">
          <Link href="/import-math" className="py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700">
            导入数学题目
          </Link>
        </div>
      </div>
      
      {!showPreview ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              用户ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="输入用户ID"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              任务标题
            </label>
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="输入任务标题"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              JSON格式题目内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={jsonContent}
              onChange={(e) => setJsonContent(e.target.value)}
              rows={10}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
              placeholder={`{\n  "content1": "题目1内容",\n  "content2": "题目2内容"\n}`}
            />
          </div>
          
          {parseError && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded">
              <p className="text-red-700">{parseError}</p>
            </div>
          )}
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setJsonContent(`{
  "content1": "某家电商场计划用9万元从生产厂家家购进50台电视机.已知该厂家生产三种不同型号的电视机，出厂价分别为：甲种每台1500元，乙种每台2100元，丙种每台2500元.\\n(1)若该家电商场同时购进两种不同型号的电视机共50台，用去9万元，请你研究一下商场的进货方案；\\n(2)若该商场销售一台甲种电视机可获利150元，销售一台乙种电视机可获利200元，销售一台丙种电视机可获利250元，在(1)的方案中，为了使销售时获利最多，你选择哪种进货方案？",
  "content2": "点P从点A出发，以2个单位/秒的速度沿着"坡数轴"向右运动。同时点Q从点B出发，以每秒1个单位的速度沿着"坡数轴"向左运动。经过多久，PQ=2？\\n①点P从点A出发，以2个单位/秒的速度沿着"坡数轴"向右运动。同时点Q从点B出发，以每秒1个单位的速度沿着"坡数轴"向左运动。当P重新回到A点时所有运动结束。设P点运动时间为t秒，在移动过程中，何时PQ=2？PO？直接写出t的值。"
}`);
              }}
              className="py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700"
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
              className="py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              示例2
            </button>
            
            <button
              onClick={fixJson}
              className="py-2 px-4 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
            >
              尝试修复JSON
            </button>
            
            <button
              onClick={parseJson}
              disabled={loading}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              解析JSON
            </button>
          </div>
          
          {debugInfo && (
            <div className="mt-4">
              <h3 className="font-medium text-sm text-gray-700 mb-1">调试信息:</h3>
              <pre className="text-xs bg-gray-100 p-3 rounded-md overflow-auto max-h-40">
                {debugInfo}
              </pre>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">已解析 {parsedProblems.length} 个题目</h3>
          
          <div className="border border-gray-200 rounded-md p-4 max-h-80 overflow-auto">
            {parsedProblems.map((problem, index) => (
              <div key={index} className="mb-4 pb-4 border-b border-gray-200 last:border-0">
                <h4 className="font-medium text-gray-700 mb-1">题目 {problem.index}</h4>
                <pre className="text-sm bg-gray-50 p-2 rounded whitespace-pre-wrap overflow-auto">
                  {problem.content}
                </pre>
              </div>
            ))}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setShowPreview(false)}
              className="py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              返回编辑
            </button>
            
            <button
              onClick={handleImport}
              disabled={loading}
              className="flex-1 py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? '导入中...' : '确认导入'}
            </button>
          </div>
        </div>
      )}
      
      <div className="mt-6 text-sm text-gray-600">
        <h3 className="font-medium mb-2">调试提示:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>观察调试信息，了解解析过程</li>
          <li>使用"尝试修复JSON"按钮自动修复常见问题</li>
          <li>尝试使用示例按钮测试是否可解析标准格式</li>
          <li>检查JSON是否以{'{'}开始，以{'}'}结束</li>
          <li>尝试手动修复数学公式中的反斜杠，使用双反斜杠</li>
        </ul>
      </div>
    </div>
  );
} 

