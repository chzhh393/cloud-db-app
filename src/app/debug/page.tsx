'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function DebugJsonPage() {
  const [jsonInput, setJsonInput] = useState('');
  const [processedJson, setProcessedJson] = useState('');
  const [parseResult, setParseResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, message]);
  };
  
  // 预处理JSON
  const preprocessJson = () => {
    addLog('开始预处理JSON');
    try {
      let processed = jsonInput.trim();
      
      // 确保开始和结束大括号
      if (!processed.startsWith('{')) {
        processed = '{' + processed;
        addLog('添加了开始大括号');
      }
      
      if (!processed.endsWith('}')) {
        processed = processed + '}';
        addLog('添加了结束大括号');
      }
      
      // 处理转义字符
      let count = 0;
      processed = processed.replace(/\\\[/g, () => {
        count++;
        return '\\\\[';
      });
      addLog(`替换了${count}个左数学方括号`);
      
      count = 0;
      processed = processed.replace(/\\\]/g, () => {
        count++;
        return '\\\\]';
      });
      addLog(`替换了${count}个右数学方括号`);
      
      // 处理可能未转义的反斜杠
      const original = processed;
      processed = processed.replace(/(?<!\\)\\(?![\\"])/g, '\\\\');
      if (original !== processed) {
        addLog('处理了未转义的反斜杠');
      }
      
      setProcessedJson(processed);
      addLog(`预处理完成，字符数: ${processed.length}`);
      return processed;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      addLog(`预处理出错: ${message}`);
      setError(message);
      return null;
    }
  };
  
  // 尝试解析
  const testParse = () => {
    setLogs([]);
    setError(null);
    setParseResult(null);
    
    const processed = preprocessJson();
    if (!processed) return;
    
    try {
      addLog('尝试解析处理后的JSON');
      const result = JSON.parse(processed);
      addLog(`解析成功! 包含${Object.keys(result).length}个键`);
      
      // 检查content键
      const contentKeys = Object.keys(result).filter(k => k.startsWith('content'));
      addLog(`发现${contentKeys.length}个content键: ${contentKeys.join(', ')}`);
      
      setParseResult(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      addLog(`解析出错: ${message}`);
      
      // 尝试定位错误位置
      if (err instanceof SyntaxError) {
        const errorMsg = err.message;
        const posMatch = errorMsg.match(/position (\d+)/);
        if (posMatch && posMatch[1]) {
          const pos = parseInt(posMatch[1]);
          const context = processed.substring(
            Math.max(0, pos - 20),
            Math.min(processed.length, pos + 20)
          );
          addLog(`错误位置附近: ...${context}...`);
          addLog(`错误字符: "${processed.charAt(pos)}"`);
        }
      }
      
      setError(message);
    }
  };
  
  // 尝试各种方法解析
  const tryAllMethods = () => {
    setLogs([]);
    setError(null);
    setParseResult(null);
    
    addLog('尝试多种方法解析JSON');
    
    // 方法1: 直接解析
    try {
      addLog('方法1: 直接解析原始输入');
      const result = JSON.parse(jsonInput);
      addLog(`直接解析成功! 包含${Object.keys(result).length}个键`);
      setParseResult(result);
      return;
    } catch (err) {
      addLog(`直接解析失败: ${err instanceof Error ? err.message : String(err)}`);
    }
    
    // 方法2: 预处理后解析
    const processed = preprocessJson();
    if (processed) {
      try {
        addLog('方法2: 解析预处理后的JSON');
        const result = JSON.parse(processed);
        addLog(`预处理后解析成功! 包含${Object.keys(result).length}个键`);
        setParseResult(result);
        return;
      } catch (err) {
        addLog(`预处理后解析失败: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    
    // 方法3: 正则表达式提取
    try {
      addLog('方法3: 使用正则表达式提取content');
      const result: Record<string, string> = {};
      const regex = /"content(\d+)"\s*:\s*"([^"]*)"/g;
      let match;
      
      while ((match = regex.exec(jsonInput)) !== null) {
        const key = 'content' + match[1];
        const value = match[2];
        result[key] = value;
        addLog(`提取到键: ${key}, 值长度: ${value.length}`);
      }
      
      if (Object.keys(result).length > 0) {
        addLog(`正则表达式提取成功! 找到${Object.keys(result).length}个键`);
        setParseResult(result);
        return;
      } else {
        addLog('正则表达式未找到匹配项');
      }
    } catch (err) {
      addLog(`正则表达式提取失败: ${err instanceof Error ? err.message : String(err)}`);
    }
    
    setError('所有解析方法都失败');
  };
  
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">腾讯云开发任务管理</h1>
        
        <div className="flex space-x-2">
          <Link href="/import-math" className="py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700">
            导入数学题目
          </Link>
        </div>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">JSON解析调试工具</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">输入JSON</h2>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            rows={10}
            className="w-full p-2 border border-gray-300 rounded-md font-mono text-sm"
            placeholder='{"content1": "题目内容"}'
          />
          
          <div className="flex space-x-2 mt-4">
            <button
              onClick={testParse}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              常规解析
            </button>
            
            <button
              onClick={tryAllMethods}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              尝试所有方法
            </button>
            
            <button
              onClick={() => {
                setJsonInput(`{
  "content1": "5 反 比 例\\n第1关 练速度\\n1. 把相同体积的水倒入底面积不同的杯子。\\n\\n| 水的高度/cm | 30 | 24 | 18 | 9 | ... |\\n|---|---|---|---|---|---|\\n| 杯子的底面积/cm² | 12 | 15 | 20 | 40 | ... |\\n\\n(1) 表中（    ）和（    ）是两个相关联的量，这两个量的（    ）一定，成（    ）比例。\\n(2) 当水的高度是15 cm时，杯子的底面积是（    ）cm²；当杯子的底面积是50 cm²时，水的高度是（    ）cm。"
}`);
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              测试样本
            </button>
          </div>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">处理结果</h2>
          
          <div className="mb-4">
            <h3 className="text-md font-medium">预处理后的JSON:</h3>
            <pre className="p-2 bg-gray-100 rounded-md overflow-auto text-xs max-h-40">
              {processedJson || '(未处理)'}
            </pre>
          </div>
          
          {error && (
            <div className="mb-4 p-2 bg-red-50 border-l-4 border-red-500 text-red-700">
              <p className="font-medium">错误:</p>
              <p>{error}</p>
            </div>
          )}
          
          {parseResult && (
            <div className="mb-4">
              <h3 className="text-md font-medium">解析结果:</h3>
              <pre className="p-2 bg-green-50 rounded-md overflow-auto text-xs max-h-40">
                {JSON.stringify(parseResult, null, 2)}
              </pre>
            </div>
          )}
          
          <div>
            <h3 className="text-md font-medium">日志:</h3>
            <div className="p-2 bg-gray-100 rounded-md overflow-auto max-h-40">
              {logs.map((log, index) => (
                <div key={index} className="text-xs mb-1">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">解决方案推荐</h2>
        <div className="bg-blue-50 p-4 rounded-md">
          <p className="mb-2">如果您的JSON解析一直失败，尝试以下方法：</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>确保JSON格式正确，使用在线JSON验证工具检查</li>
            <li>处理特殊字符，特别是反斜杠和引号</li>
            <li>对于数学公式，使用双反斜杠转义</li>
            <li>确保所有键名都有引号</li>
            <li>尝试使用文件上传而不是直接粘贴</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

