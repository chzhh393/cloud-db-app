'use client';

import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface MathContentProps {
  content: string;
}

export default function MathContent({ content }: MathContentProps) {
  // 解析内容，识别数学公式、表格等
  const renderContent = () => {
    // 将内容按行分割
    const lines = content.split('\\n');
    
    return lines.map((line, index) => {
      // 检测是否为表格行
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        return <div key={index} className="overflow-x-auto my-2">{renderTable(lines, index)}</div>;
      }
      
      // 检测是否为数学公式行
      if (line.includes('\\[') && line.includes('\\]')) {
        return renderMathLine(line, index);
      }
      
      // 普通文本行
      return <p key={index} className="my-1">{renderInlineMath(line)}</p>;
    });
  };
  
  // 渲染表格
  const renderTable = (lines: string[], startIndex: number) => {
    // 寻找表格的结束行
    let endIndex = startIndex;
    while (endIndex < lines.length && lines[endIndex].trim().startsWith('|') && lines[endIndex].trim().endsWith('|')) {
      endIndex++;
    }
    
    // 提取表格行
    const tableLines = lines.slice(startIndex, endIndex);
    
    // 创建HTML表格
    return (
      <table className="border-collapse border border-gray-300">
        <tbody>
          {tableLines.map((line, idx) => {
            // 跳过分隔行 (|---|---|...)
            if (line.includes('---')) return null;
            
            // 分割单元格内容
            const cells = line.split('|').filter(cell => cell.trim() !== '');
            
            return (
              <tr key={idx}>
                {cells.map((cell, cellIdx) => (
                  <td key={cellIdx} className="border border-gray-300 px-2 py-1">
                    {renderInlineMath(cell.trim())}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };
  
  // 渲染包含数学公式的行
  const renderMathLine = (line: string, index: number) => {
    // 提取块级数学公式
    const blockMathRegex = /\\\[(.*?)\\\]/g;
    const parts = line.split(blockMathRegex);
    
    return (
      <div key={index} className="my-2">
        {parts.map((part, partIdx) => {
          if (partIdx % 2 === 1) {
            // 这是数学公式部分
            try {
              return <BlockMath key={partIdx} math={part} />;
            } catch (error) {
              return <pre key={partIdx} className="text-red-500">{`[数学公式解析错误: ${part}]`}</pre>;
            }
          } else {
            // 这是普通文本部分
            return part ? <span key={partIdx}>{renderInlineMath(part)}</span> : null;
          }
        })}
      </div>
    );
  };
  
  // 渲染行内数学公式
  const renderInlineMath = (text: string) => {
    // 处理行内数学公式 \( ... \)
    const inlineMathRegex = /\\\((.*?)\\\)/g;
    const parts = text.split(inlineMathRegex);
    
    if (parts.length === 1) {
      return text;
    }
    
    return (
      <>
        {parts.map((part, idx) => {
          if (idx % 2 === 1) {
            // 这是数学公式部分
            try {
              return <InlineMath key={idx} math={part} />;
            } catch (error) {
              return <span key={idx} className="text-red-500">{`[数学公式错误]`}</span>;
            }
          } else {
            // 这是普通文本部分
            return <span key={idx}>{part}</span>;
          }
        })}
      </>
    );
  };

  return (
    <div className="math-content">
      {renderContent()}
    </div>
  );
} 