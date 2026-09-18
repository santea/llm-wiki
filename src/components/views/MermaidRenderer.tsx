import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Copy, Check, Code2, Eye, AlertTriangle, Maximize2 } from 'lucide-react';

interface MermaidRendererProps {
  chart: string;
  title?: string;
  className?: string;
}

// Initialize Mermaid once with dark slate obsidian theme
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    darkMode: true,
    background: '#0c0e14',
    mainBkg: '#191b22',
    primaryColor: '#282a30',
    primaryTextColor: '#e2e2eb',
    primaryBorderColor: '#7c3aed',
    lineColor: '#4cd7f6',
    secondaryColor: '#1e1f26',
    tertiaryColor: '#14151b',
    edgeLabelBackground: '#191b22',
    fontFamily: 'JetBrains Mono, ui-monospace, sans-serif',
    fontSize: '12px'
  },
  securityLevel: 'loose'
});

export const MermaidRenderer: React.FC<MermaidRendererProps> = ({
  chart,
  title = '아키텍처 워크플로우 다이어그램',
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgHtml, setSvgHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const renderChart = async () => {
      if (!chart.trim()) {
        setSvgHtml('');
        setError(null);
        return;
      }

      try {
        const uniqueId = `mermaid-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const cleanChart = chart
          .replace(/```mermaid\n?|\n?```/g, '')
          .trim();

        const { svg } = await mermaid.render(uniqueId, cleanChart);
        if (isMounted) {
          setSvgHtml(svg);
          setError(null);
        }
      } catch (err: any) {
        console.warn('Mermaid rendering failed:', err);
        if (isMounted) {
          setError(err.message || '다이어그램 렌더링 구문 오류');
          setSvgHtml('');
        }
      }
    };

    renderChart();
    return () => {
      isMounted = false;
    };
  }, [chart]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(chart.replace(/```mermaid\n?|\n?```/g, '').trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={`p-4 rounded-xl bg-[#191b22] border border-[#2e3547] space-y-3 shadow-md ${className}`}>
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse"></span>
          <span className="text-xs sm:text-sm font-semibold text-[#e2e2eb]">{title}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-[#4cd7f6] bg-[#282a30] px-2 py-0.5 rounded hidden sm:inline-block">
            Mermaid v11 Live
          </span>
          <button
            onClick={() => setShowCode(!showCode)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#282a30] hover:bg-[#33343b] text-[#ccc3d8] text-xs font-mono transition-colors"
            title={showCode ? '다이어그램 보기' : 'Mermaid 코드 보기'}
          >
            {showCode ? <Eye className="w-3.5 h-3.5 text-[#4cd7f6]" /> : <Code2 className="w-3.5 h-3.5 text-[#d2bbff]" />}
            <span className="text-[11px]">{showCode ? '시각화' : '코드'}</span>
          </button>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#282a30] hover:bg-[#33343b] text-[#ccc3d8] text-xs font-mono transition-colors"
            title="Mermaid 코드 복사"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#4edea3]" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="text-[11px]">{copied ? '복사됨' : '복사'}</span>
          </button>
        </div>
      </div>

      {/* Main Display Area */}
      {showCode ? (
        <div className="w-full bg-[#0c0e14] rounded-lg p-3 font-mono text-xs text-[#d2bbff] overflow-x-auto border border-[#2e3547]">
          <pre className="m-0 p-0 whitespace-pre leading-relaxed">
            <code>{chart.replace(/```mermaid\n?|\n?```/g, '').trim()}</code>
          </pre>
        </div>
      ) : error ? (
        <div className="w-full bg-[#1e1418] border border-[#ffb4ab]/40 rounded-lg p-4 text-xs font-mono text-[#ffb4ab] space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#ffb4ab]" />
            <span className="font-semibold">다이어그램 문법 오류</span>
          </div>
          <p className="text-[11px] opacity-80">{error}</p>
          <pre className="p-2 bg-[#0c0e14] rounded text-[10px] overflow-x-auto text-[#ccc3d8]">
            {chart}
          </pre>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="w-full bg-[#0c0e14] rounded-lg p-4 flex justify-center items-center overflow-x-auto border border-[#2e3547]/60 min-h-[140px] [&_svg]:max-w-full [&_svg]:h-auto transition-all"
          dangerouslySetInnerHTML={{ __html: svgHtml }}
        />
      )}
    </div>
  );
};
