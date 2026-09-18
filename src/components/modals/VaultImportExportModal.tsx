import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  X,
  FileText,
  CheckCircle2,
  FolderArchive,
  Loader2,
  Database
} from 'lucide-react';
import { NoteItem } from '../../types';
import { importMarkdownFiles } from '../../api';

interface VaultImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: NoteItem[];
  onImportComplete: (importedNotes: NoteItem[]) => void;
  onShowToast: (msg: string) => void;
}

export const VaultImportExportModal: React.FC<VaultImportExportModalProps> = ({
  isOpen,
  onClose,
  notes,
  onImportComplete,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [selectedFiles, setSelectedFiles] = useState<Array<{ name: string; content: string }>>([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList: Array<{ name: string; content: string }> = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.name.endsWith('.md') || f.name.endsWith('.txt')) {
        const text = await f.text();
        fileList.push({ name: f.name, content: text });
      }
    }

    setSelectedFiles(fileList);
    onShowToast(`${fileList.length}개의 마크다운 파일이 선택되었습니다.`);
  };

  const handleRunImport = async () => {
    if (selectedFiles.length === 0) {
      onShowToast('가져올 마크다운 파일을 먼저 선택해주세요.');
      return;
    }

    setIsImporting(true);
    try {
      const payload = selectedFiles.map((f) => ({
        filename: f.name,
        content: f.content
      }));

      const imported = await importMarkdownFiles(payload);
      onImportComplete(imported);
      setSelectedFiles([]);
      onShowToast(`${imported.length}건의 마크다운 문서가 PostgreSQL에 성공적으로 저장되었습니다!`);
      onClose();
    } catch (err: any) {
      console.error(err);
      onShowToast('파일 가져오기 중 오류가 발생했습니다.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(notes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `obsidian_slate_vault_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onShowToast(`${notes.length}건의 문서가 JSON 백업 파일로 내보내졌습니다.`);
  };

  const handleExportMarkdownZip = () => {
    // For single markdown file export bundle
    let fullMd = `# 🌌 Obsidian Slate 지식 볼트 백업\n생성일시: ${new Date().toLocaleString('ko-KR')}\n\n`;
    notes.forEach((n) => {
      fullMd += `## [[${n.title}]]\n카테고리: ${n.categoryFull || n.category} | 태그: ${n.tags.join(', ')}\n\n${n.content || n.excerpt || ''}\n\n---\n\n`;
    });

    const blob = new Blob([fullMd], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `obsidian_slate_all_notes_${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    onShowToast('전체 마크다운 지식 볼트 번들이 다운로드되었습니다.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0c0e14]/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#191b22] border border-[#2e3547] w-full max-w-lg rounded-2xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderArchive className="w-5 h-5 text-[#4cd7f6]" />
            <h3 className="text-base font-bold text-[#e2e2eb]">
              옵시디언 마크다운 볼트 가져오기 / 내보내기
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#958da1] hover:text-[#e2e2eb] transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-[#2e3547] pb-2">
          <button
            onClick={() => setActiveTab('import')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'import'
                ? 'bg-[#7c3aed] text-white'
                : 'text-[#958da1] hover:text-[#e2e2eb]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>마크다운 가져오기 (Import)</span>
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'export'
                ? 'bg-[#7c3aed] text-white'
                : 'text-[#958da1] hover:text-[#e2e2eb]'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>볼트 내보내기 (Export)</span>
          </button>
        </div>

        {/* Import Tab */}
        {activeTab === 'import' && (
          <div className="space-y-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#2e3547] hover:border-[#4cd7f6] rounded-xl p-6 text-center cursor-pointer transition-all bg-[#0c0e14]/50 flex flex-col items-center justify-center space-y-2"
            >
              <Upload className="w-8 h-8 text-[#4cd7f6]" />
              <div className="text-xs font-semibold text-[#e2e2eb]">
                로컬 .md 파일을 클릭하여 선택하거나 드래그하세요
              </div>
              <p className="text-[11px] text-[#958da1]">
                옵시디언 마크다운 위키링크([[...]])와 태그가 자동 파싱되어 PostgreSQL에 적재됩니다.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".md,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                <span className="text-xs font-mono text-[#4edea3] font-semibold">
                  선택된 파일 ({selectedFiles.length}개):
                </span>
                <div className="space-y-1">
                  {selectedFiles.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded bg-[#0c0e14] text-xs font-mono text-[#ccc3d8] border border-[#2e3547]"
                    >
                      <span className="truncate">{f.name}</span>
                      <span className="text-[10px] text-[#958da1]">{f.content.length}자</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleRunImport}
              disabled={isImporting || selectedFiles.length === 0}
              className="w-full py-2.5 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 text-white text-xs font-mono font-bold flex items-center justify-center gap-2 shadow-md transition-colors"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>PostgreSQL DB에 색인 및 임베딩 생성 중...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>선택한 파일 PostgreSQL에 일괄 저장 ({selectedFiles.length}건)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="space-y-3">
            <p className="text-xs text-[#958da1] leading-relaxed">
              현재 PostgreSQL 데이터베이스에 저장된 {notes.length}건의 모든 아키텍처 문서와 백링크 데이터를 로컬 파일로 백업할 수 있습니다.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleExportMarkdownZip}
                className="p-4 rounded-xl bg-[#0c0e14] border border-[#2e3547] hover:border-[#4cd7f6] flex flex-col items-center justify-center space-y-2 text-center transition-all group"
              >
                <FileText className="w-6 h-6 text-[#4cd7f6] group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-[#e2e2eb]">통합 마크다운 (.md)</span>
                <span className="text-[10px] text-[#958da1]">모든 문서를 번들 마크다운으로 다운로드</span>
              </button>

              <button
                onClick={handleExportJson}
                className="p-4 rounded-xl bg-[#0c0e14] border border-[#2e3547] hover:border-[#7c3aed] flex flex-col items-center justify-center space-y-2 text-center transition-all group"
              >
                <FolderArchive className="w-6 h-6 text-[#d2bbff] group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-[#e2e2eb]">JSON 풀 백업 (.json)</span>
                <span className="text-[10px] text-[#958da1]">메타데이터와 백링크 포함 풀 백업</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
