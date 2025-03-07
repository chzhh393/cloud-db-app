'use client';

import { useState, useEffect } from 'react';
import { getCloudBaseClient, ensureAuthenticated, testDatabaseConnection, getModelsAPI } from '../lib/cloudbase-client';
import Link from 'next/link';

// 数学题目导入组件
export default function ImportMathProblems() {
  // 格式化当前日期时间为MMDDHHSS格式
  const formatDateTime = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    return `${month}${day}${hour}${minute}`;
  };

  // 生成默认标题
  const getDefaultTitle = () => `数学题集${formatDateTime()}`;
  
  const [userId, setUserId] = useState<string>('user001'); // 默认值方便测试
  const [jsonContent, setJsonContent] = useState<string>('');
  const [taskTitle, setTaskTitle] = useState<string>(getDefaultTitle()); // 使用带日期时间的默认标题
  const [loading, setLoading] = useState<boolean>(false);
  const [parsedProblems, setParsedProblems] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string>('');

  // 每分钟更新默认标题
  useEffect(() => {
    // 如果用户没有手动修改标题，则自动更新
    const interval = setInterval(() => {
      setTaskTitle(prevTitle => {
        // 只有当标题是默认格式时才更新
        if (prevTitle.startsWith('数学题集') && prevTitle.length === 10) {
          return getDefaultTitle();
        }
        return prevTitle;
      });
    }, 60000); // 每分钟更新一次
    
    return () => clearInterval(interval);
  }, []);

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
  const parseJsonContent = () => {
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

  // 辅助函数：从数据库结果中提取ID
  const extractIdFromResult = (result: any): string | null => {
    if (!result) {
      logDebug('提取ID失败：结果为空');
      return null;
    }
    
    // 记录完整结果
    logDebug('尝试从结果中提取ID', {
      resultType: typeof result,
      hasId: result && 'id' in result,
      has_id: result && '_id' in result,
      hasData: result && 'data' in result,
      resultKeys: result ? Object.keys(result) : []
    });
    
    // 尝试多种路径获取ID
    if (result.id) return result.id;
    if (result._id) return result._id;
    if (result.data && result.data.id) return result.data.id;
    if (result.data && result.data._id) return result.data._id;
    if (result.data && Array.isArray(result.data) && result.data[0]) {
      if (result.data[0].id) return result.data[0].id;
      if (result.data[0]._id) return result.data[0]._id;
    }
    
    // 如果是字符串，可能直接就是ID
    if (typeof result === 'string') return result;
    
    // 如果是对象但没有找到ID字段，尝试序列化查看
    if (typeof result === 'object') {
      try {
        const serialized = JSON.stringify(result);
        logDebug('无法从对象中找到ID字段', {
          serialized: serialized.length > 200 ? serialized.substring(0, 200) + '...' : serialized
        });
      } catch (error) {
        logDebug('序列化结果对象失败', {
          error: error instanceof Error ? error.message : '未知错误'
        });
      }
    }
    
    return null;
  };

  // 导入题目到数据库
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
    setDebugInfo(''); // 清空之前的调试信息
    logDebug('开始导入题目');
    
    try {
      // 首先测试数据库连接
      logDebug('测试数据库连接...');
      const connectionTest = await testDatabaseConnection();
      logDebug('数据库连接测试结果', connectionTest);
      
      if (!connectionTest.success) {
        throw new Error(`数据库连接失败: ${connectionTest.message}`);
      }
      
      // 确保已认证
      await ensureAuthenticated();
      logDebug('认证成功');
      
      // 获取models API
      const models = await getModelsAPI();
      if (!models) {
        throw new Error('获取models API失败');
      }
      
      logDebug('获取models API成功');
      
      // 创建新任务
      const taskClientId = `task_${Date.now()}`; // 客户端生成的ID，仅用于日志
      const task = {
        task_id: taskClientId, // 这个字段将来可能不再需要，但保留以兼容现有数据
        title: taskTitle || getDefaultTitle(),
        user_id: userId,
        conversation_id: `conv_${Date.now()}`,
        status: '未开始',
        created_at: new Date(),
      };
      
      logDebug('准备创建任务', { taskClientId, userId });
      
      // 用于存储数据库生成的任务ID
      let dbTaskId = '';
      
      // 尝试使用models API创建任务
      try {
        // 首先检查collection是否存在，不存在则尝试创建
        let collectionsData;
        try {
          collectionsData = await models.getCollections();
          logDebug('获取集合列表成功', { collections: collectionsData });
        } catch (err) {
          logDebug('获取集合列表失败', { error: err instanceof Error ? err.message : '未知错误' });
        }
        
        // 创建任务记录
        const taskResult = await models.ai_tasks.create({
          data: task
        });
        
        // 记录完整的返回结果，以便调试
        logDebug('任务创建返回结果(models API)', {
          fullResult: JSON.stringify(taskResult)
        });
        
        // 使用辅助函数提取ID
        const extractedId = extractIdFromResult(taskResult);
        if (extractedId) {
          dbTaskId = extractedId;
          logDebug('成功从models API结果中提取ID', { dbTaskId });
        } else {
          logDebug('无法从models API结果中提取ID');
        }
        
        logDebug('任务创建成功(models API)', { 
          taskClientId,
          dbTaskId, // 数据库生成的ID
          taskTitle: task.title,
          createdAt: task.created_at.toLocaleString('zh-CN'),
          dbResult: JSON.stringify(taskResult),
          taskCollection: 'ai_tasks'
        });
      } catch (modelError) {
        logDebug('使用models API创建任务失败', { 
          error: modelError instanceof Error ? modelError.message : '未知错误'
        });
        
        // 如果models API失败，尝试使用database API
        try {
          const app = await getCloudBaseClient();
          if (!app) {
            throw new Error('云开发客户端初始化失败');
          }
          
          const db = app.database();
          const taskResult = await db.collection('ai_tasks').add(task);
          
          // 记录完整的返回结果，以便调试
          logDebug('任务创建返回结果(database API)', {
            fullResult: JSON.stringify(taskResult)
          });
          
          // 使用辅助函数提取ID
          const extractedId = extractIdFromResult(taskResult);
          if (extractedId) {
            dbTaskId = extractedId;
            logDebug('成功从database API结果中提取ID', { dbTaskId });
          } else {
            logDebug('无法从database API结果中提取ID');
          }
          
          logDebug('任务创建成功(database API)', { 
            taskClientId,
            dbTaskId, // 数据库生成的ID
            taskTitle: task.title,
            createdAt: task.created_at.toLocaleString('zh-CN'),
            dbResult: JSON.stringify(taskResult)
          });
        } catch (dbError) {
          logDebug('使用database API创建任务也失败', { 
            error: dbError instanceof Error ? dbError.message : '未知错误'
          });
          
          // 如果使用database API也失败，可能需要手动创建集合
          logDebug('可能需要在腾讯云开发控制台手动创建ai_tasks和ai_problems集合');
          throw new Error('创建任务失败: 数据库集合不存在。请在腾讯云开发控制台创建ai_tasks和ai_problems集合。');
        }
      }
      
      // 确保我们有数据库生成的任务ID
      if (!dbTaskId) {
        logDebug('警告：无法获取数据库生成的任务ID，将使用客户端生成的ID作为回退', {
          taskClientId
        });
        // 使用客户端生成的ID作为回退
        dbTaskId = taskClientId;
      }
      
      logDebug('使用任务ID创建问题', { dbTaskId, isClientGenerated: dbTaskId === taskClientId });
      
      // 创建题目记录
      const createdProblems = [];
      const failedProblems = [];
      
      for (const problem of parsedProblems) {
        const problemData = {
          task_id: dbTaskId, // 使用数据库生成的任务ID
          problem_key: problem.key || `problem_${problem.index}`,
          content: problem.content,
          answered: false,
          created_at: new Date(),
        };
        
        try {
          logDebug(`准备创建问题 ${problem.index}`, {
            problemKey: problemData.problem_key,
            contentLength: problem.content.length,
            taskId: dbTaskId // 使用数据库生成的任务ID
          });
          
          // 尝试使用models API创建问题
          try {
            const problemResult = await models.ai_problems.create({
              data: problemData
            });
            
            const createdProblem = {
              ...problemData,
              id: problemResult.id || '未知ID'
            };
            
            createdProblems.push(createdProblem);
            
            logDebug(`问题 ${problem.index} 创建成功(models API)`, { 
              problemId: problemResult.id,
              problemKey: problemData.problem_key,
              taskId: dbTaskId // 使用数据库生成的任务ID
            });
          } catch (modelError) {
            // 如果models API失败，尝试使用database API
            logDebug(`使用models API创建问题 ${problem.index} 失败`, { 
              error: modelError instanceof Error ? modelError.message : '未知错误'
            });
            
            const app = await getCloudBaseClient();
            const db = app.database();
            const problemResult = await db.collection('ai_problems').add(problemData);
            
            const createdProblem = {
              ...problemData,
              id: problemResult.id || '未知ID'
            };
            
            createdProblems.push(createdProblem);
            
            logDebug(`问题 ${problem.index} 创建成功(database API)`, { 
              problemId: problemResult.id,
              problemKey: problemData.problem_key,
              taskId: dbTaskId // 使用数据库生成的任务ID
            });
          }
        } catch (err) {
          failedProblems.push({
            index: problem.index,
            error: err instanceof Error ? err.message : '未知错误'
          });
          
          logDebug(`问题 ${problem.index} 创建失败`, { 
            error: err instanceof Error ? err.message : '未知错误',
            problemData: JSON.stringify({
              task_id: problemData.task_id,
              problem_key: problemData.problem_key
            })
          });
        }
      }
      
      // 验证创建结果
      try {
        const taskResults = await models.ai_tasks.find({ 
          where: { _id: dbTaskId }
        });
        
        logDebug('验证任务创建(models API)', { 
          dbTaskId,
          found: taskResults && taskResults.data && taskResults.data.length > 0,
          data: taskResults
        });
      } catch (error) {
        logDebug('验证任务失败(models API)', { 
          error: error instanceof Error ? error.message : '未知错误' 
        });
        
        // 如果models API失败，尝试使用database API
        try {
          const app = await getCloudBaseClient();
          const db = app.database();
          const taskQuery = await db.collection('ai_tasks')
            .where({ _id: dbTaskId })
            .get();
          
          logDebug('验证任务创建(database API)', { 
            dbTaskId,
            found: taskQuery.data && taskQuery.data.length > 0
          });
        } catch (dbError) {
          logDebug('验证任务失败(database API)', { 
            error: dbError instanceof Error ? dbError.message : '未知错误' 
          });
        }
      }
      
      // 验证问题创建
      try {
        const problemsQuery = await models.ai_problems.find({
          where: { task_id: dbTaskId }
        });
        
        logDebug('验证问题创建(models API)', {
          dbTaskId,
          count: problemsQuery.data ? problemsQuery.data.length : 0,
          expected: parsedProblems.length
        });
      } catch (error) {
        logDebug('验证问题创建失败(models API)', {
          error: error instanceof Error ? error.message : '未知错误'
        });
      }
      
      const summaryMessage = `成功创建任务【${task.title}】(ID: ${dbTaskId})和${createdProblems.length}个题目`;
      logDebug('导入完成', { 
        taskClientId,
        dbTaskId,
        taskTitle: task.title,
        totalProblems: parsedProblems.length,
        createdProblems: createdProblems.length,
        failedProblems: failedProblems.length,
        firstProblemId: createdProblems.length > 0 ? createdProblems[0].id : '无'
      });
      
      setParseError('');
      alert(summaryMessage + "\n\n注意：如果看到数据库集合不存在的错误，请在腾讯云开发控制台中手动创建ai_tasks和ai_problems集合。");
      
      // 重置状态
      setParsedProblems([]);
      setShowPreview(false);
      setJsonContent('');
      
    } catch (error) {
      console.error('导入失败:', error);
      setParseError('导入失败: ' + (error instanceof Error ? error.message : '未知错误'));
      logDebug(`导入失败`, { 
        error: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : '无堆栈信息'
      });
    } finally {
      setLoading(false);
    }
  };

  // 添加数据库检查功能
  const checkDatabaseStatus = async () => {
    setDebugInfo(''); // 清空之前的调试信息
    logDebug('开始检查数据库状态...');
    setLoading(true);
    
    try {
      // 测试数据库连接
      const connectionTest = await testDatabaseConnection();
      logDebug('数据库连接测试', connectionTest);
      
      // 获取models API
      try {
        const models = await getModelsAPI();
        if (!models) {
          logDebug('models API不可用');
        } else {
          // 获取集合列表
          try {
            const collections = await models.getCollections();
            logDebug('数据库集合列表', collections);
            
            // 检查是否存在必要的集合
            const hasTasksCollection = collections.data.some((c: any) => c.name === 'ai_tasks');
            const hasProblemsCollection = collections.data.some((c: any) => c.name === 'ai_problems');
            
            logDebug('集合状态', {
              hasTasksCollection,
              hasProblemsCollection
            });
            
            if (!hasTasksCollection || !hasProblemsCollection) {
              logDebug('需要创建的集合', {
                ai_tasks: !hasTasksCollection,
                ai_problems: !hasProblemsCollection
              });
              
              setParseError('数据库缺少必要的集合。请在腾讯云开发控制台中创建：' + 
                           (!hasTasksCollection ? 'ai_tasks ' : '') + 
                           (!hasProblemsCollection ? 'ai_problems' : ''));
            } else {
              logDebug('所有必要的集合都已存在');
              setParseError('');
            }
          } catch (error) {
            logDebug('获取集合列表失败', { error: error instanceof Error ? error.message : '未知错误' });
          }
        }
      } catch (error) {
        logDebug('获取models API失败', { error: error instanceof Error ? error.message : '未知错误' });
      }
      
      // 使用database API测试
      try {
        const app = await getCloudBaseClient();
        if (!app) {
          logDebug('云开发客户端初始化失败');
        } else {
          const db = app.database();
          try {
            const tasksCount = await db.collection('ai_tasks').count();
            logDebug('ai_tasks集合访问测试', tasksCount);
          } catch (error) {
            logDebug('ai_tasks集合访问失败', { error: error instanceof Error ? error.message : '未知错误' });
          }
          
          try {
            const problemsCount = await db.collection('ai_problems').count();
            logDebug('ai_problems集合访问测试', problemsCount);
          } catch (error) {
            logDebug('ai_problems集合访问失败', { error: error instanceof Error ? error.message : '未知错误' });
          }
        }
      } catch (error) {
        logDebug('database API测试失败', { error: error instanceof Error ? error.message : '未知错误' });
      }
      
    } catch (error) {
      logDebug('数据库状态检查失败', { error: error instanceof Error ? error.message : '未知错误' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">导入数学题目</h2>
      
      {!showPreview ? (
        <div className="space-y-4">
          <div className="flex justify-between">
            <h3 className="text-lg font-medium">填写信息</h3>
            <button
              onClick={checkDatabaseStatus}
              className="py-1 px-3 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
              disabled={loading}
            >
              检查数据库状态
            </button>
          </div>
          
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
  "content2": "点P从点A出发，以2个单位/秒的速度沿着"坡数轴"向右运动。同时点Q从点B出发，以每秒1个单位的速度沿着"坡数轴"向左运动。经过多久，PQ=2？"
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
              onClick={parseJsonContent}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? '处理中...' : '解析JSON'}
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
          <h3 className="text-lg font-medium">
            已解析 {parsedProblems.length} 个题目
          </h3>
          
          <div className="border border-gray-200 rounded-md p-4 max-h-64 overflow-y-auto">
            {parsedProblems.map((problem, index) => (
                <div key={index} className="mb-4 pb-4 border-b border-gray-200 last:border-0">
                  <h4 className="font-medium text-gray-700 mb-1">{problem.key}</h4>
                  <pre className="whitespace-pre-wrap bg-gray-50 p-2 rounded text-sm">
                    {problem.content}
                  </pre>
                </div>
              ))}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setShowPreview(false);
                setParseError('');
              }}
              className="py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              返回编辑
            </button>
            
            <button
              onClick={handleImport}
              className="flex-1 py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700"
              disabled={loading}
            >
              {loading ? '导入中...' : '确认导入'}
            </button>
          </div>
          
          {parseError && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded">
              <p className="text-red-700">{parseError}</p>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-6 text-sm text-gray-600">
        <h3 className="font-medium mb-2">使用提示:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>JSON格式应包含content1、content2等键名</li>
          <li>如果JSON解析失败，可以使用"尝试修复JSON"按钮</li>
          <li>数学公式中的反斜杠需要双重转义，例如 \\\[ 表示 \[</li>
          <li>导入前请先预览确认题目内容正确</li>
          <li>可以点击示例按钮查看正确的格式</li>
        </ul>
      </div>
    </div>
  );
} 

