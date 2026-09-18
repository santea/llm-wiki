import React, { useState } from 'react';
import { X, FileText, Sparkles } from 'lucide-react';
import { NoteItem } from '../../types';

interface NewNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddNote: (note: NoteItem) => void;
  onShowToast: (msg: string) => void;
}

export const NewNoteModal: React.FC<NewNoteModalProps> = ({
  isOpen,
  onClose,
  onAddNote,
  onShowToast
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('소스코드');
  const [tags, setTags] = useState('#Architecture #API');
  const [content, setContent] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      onShowToast('노트 제목을 입력해주세요.');
      return;
    }

    const tagArray = tags
      .split(' ')
      .map((t) => (t.startsWith('#') ? t : `#${t}`))
      .filter((t) => t.length > 1);

    const categoryMap: Record<string, { cat: 'DB' | '연계' | '인프라' | '소스코드' | '워크플로우'; full: string }> = {
      소스코드: { cat: '소스코드', full: '소스코드 및 구현 정보' },
      인프라: { cat: '인프라', full: '시스템 인프라 정보' },
      DB: { cat: 'DB', full: '데이터베이스 정보' },
      워크플로우: { cat: '워크플로우', full: '업무 및 시스템 흐름' },
      연계: { cat: '연계', full: '외부 시스템 연계 정보' }
    };

    const resolved = categoryMap[category] || { cat: '소스코드', full: '소스코드 및 구현 정보' };

    const extractedLinks = (content.match(/\[\[(.*?)\]\]/g) || []).map((t) => t.trim());

    const newNote: NoteItem = {
      id: `note-${Date.now()}`,
      title: title.trim(),
      category: resolved.cat,
      categoryFull: resolved.full,
      tags: tagArray.length > 0 ? tagArray : ['#General'],
      statusBadge: 'AI 정제 완료',
      badgeType: 'ai-refined',
      excerpt: content.slice(0, 160) || '방금 작성된 새로운 아키텍처 지식 문서입니다.',
      updatedAt: '방금 전',
      author: '데브옵스 AI 코어',
      wordCount: content.trim().split(/\s+/).filter(Boolean).length || 50,
      charCount: content.length,
      readTime: `${Math.max(1, Math.round(content.length / 500))}분 읽기`,
      backlinksCount: extractedLinks.length,
      connectedNodes: extractedLinks.length > 0 ? extractedLinks : ['[[시스템 아키텍처]]'],
      content: content.trim(),
      codeSnippet: {
        filename: `${title.replace(/\s+/g, '')}.ts`,
        language: 'TypeScript',
        code: content.trim() || '// 새로운 지식 스니펫'
      }
    };

    onAddNote(newNote);

    onShowToast(`'${title}' 지식 노트가 성공적으로 생성되었습니다.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0c0e14]/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#191b22] border border-[#2e3547] w-full max-w-lg rounded-xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#4cd7f6]" />
            <h3 className="text-sm font-semibold text-[#e2e2eb]">새로운 지식 노트 작성</h3>
          </div>
          <button onClick={onClose} className="text-[#958da1] hover:text-[#e2e2eb]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-mono text-[#958da1]">노트 제목</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 결제 웹훅 멱등성 보장 및 데드레터 큐 설계"
              className="w-full bg-[#0c0e14] border border-[#2e3547] rounded-lg p-2.5 text-xs text-[#e2e2eb] outline-none focus:border-[#7c3aed]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-mono text-[#958da1]">카테고리</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#0c0e14] border border-[#2e3547] rounded-lg p-2 text-xs text-[#e2e2eb] outline-none focus:border-[#7c3aed]"
              >
                <option value="인프라">인프라 (Infrastructure)</option>
                <option value="소스코드">소스코드 (Source Code)</option>
                <option value="데이터베이스">데이터베이스 (Database)</option>
                <option value="워크플로우">워크플로우 (Workflow)</option>
                <option value="외부 연계">외부 연계 (Integration)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-[#958da1]">태그</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="#Payment #Idempotency"
                className="w-full bg-[#0c0e14] border border-[#2e3547] rounded-lg p-2 text-xs text-[#e2e2eb] outline-none focus:border-[#7c3aed]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-[#958da1]">본문 내용 (마크다운)</label>
              <span className="text-[10px] font-mono text-[#4edea3] flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI 자동 구조화 지원
              </span>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="시스템 설계 규격, 엔드포인트 또는 인프라 설정을 자유롭게 기술하세요..."
              className="w-full bg-[#0c0e14] border border-[#2e3547] rounded-lg p-2.5 font-mono text-xs text-[#e2e2eb] outline-none focus:border-[#7c3aed]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold text-xs transition-all shadow-md active:scale-98"
          >
            노트 저장 및 지식 인덱싱
          </button>
        </form>
      </div>
    </div>
  );
};
