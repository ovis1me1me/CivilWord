import { Plus, Minus } from 'lucide-react';
import React, { useRef, useEffect } from 'react';

// ... (Interface, Props는 변경 없음)
interface AnswerBlockProps {
  index: number;
  summaryTitle: string;
  answerOptions: string[];
  onSummaryChange: (value: string) => void;
  onAddAnswer: () => void;
  onDeleteAnswer: (answerIndex: number) => void;
  onAnswerChange: (answerIndex: number, value: string) => void;
  onAddSummary: () => void;
}

export default function AnswerBlock({
  index,
  summaryTitle,
  answerOptions,
  onSummaryChange,
  onAddAnswer,
  onDeleteAnswer,
  onAnswerChange,
  onAddSummary,
}: AnswerBlockProps) {
  // ... (Hooks 로직은 변경 없음)
  const labels = ['•'];
  const summaryTextareaRef = useRef<HTMLTextAreaElement>(null);
  const answerTextareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  const adjustTextareaHeight = (textarea: HTMLTextAreaElement | null) => {
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight(summaryTextareaRef.current);
  }, [summaryTitle]);

  useEffect(() => {
    answerOptions.forEach((_, i) => {
      adjustTextareaHeight(answerTextareaRefs.current[i]);
    });
  }, [answerOptions]);

  return (
    <div className="space-y-4 mb-6">
      {/* ✅ text-slate-800 */}
      <div className="text-xl font-semibold text-slate-800 mb-2">
        <span>답변 요지{index > 0 ? `_${index + 1}` : ''}</span>
      </div>

      {/* ✅ (수정) bg-slate-50, border-slate-200 */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
        <div className="mb-1">
          <textarea
            ref={summaryTextareaRef}
            // ... (props)
            value={summaryTitle}
            onChange={(e) => onSummaryChange(e.target.value)}
            onInput={(e) => adjustTextareaHeight(e.currentTarget)}
            placeholder="민원 요지를 입력하세요."
            className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm resize-none overflow-hidden"
            rows={1}
          />
        </div>

        {answerOptions.map((option, i) => (
          <div key={i} className="flex items-start gap-2">
            {/* ✅ (수정) bg-slate-800, border-slate-800 (기존 black과 유사하지만 세련됨) */}
            <button
              onClick={onAddAnswer}
              className="w-6 h-6 flex items-center mt-1 text-white justify-center bg-slate-800 hover:text-green-500 hover:bg-white rounded-full flex-shrink-0 border border-slate-800 transition"
              type="button"
              title="요지 추가"
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* ✅ (수정) bg-slate-800, border-slate-800 */}
            <button
              onClick={() => onDeleteAnswer(i)}
              className="w-6 h-6 flex items-center mt-1 text-white justify-center bg-slate-800 hover:text-red-500 hover:bg-white rounded-full flex-shrink-0 border border-slate-800 transition"
              type="button"
              title="요지 삭제"
            >
              <Minus className="w-5 h-5" />
            </button>

            <span className="w-5 font-bold pt-1 flex-shrink-0">{labels[i] || '•'}</span>
            <textarea
              // ... (props)
              ref={(el: HTMLTextAreaElement | null) => {
                answerTextareaRefs.current[i] = el;
              }}
              value={option}
              onChange={(e) => onAnswerChange(i, e.target.value)}
              onInput={(e) => adjustTextareaHeight(e.currentTarget)}
              placeholder="답변의 요지를 입력하세요."
              className="flex-1 p-2 border border-gray-300 rounded-lg bg-white text-sm resize-none overflow-hidden"
              rows={7}
            />
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-4">
        {/* ✅ (수정) bg-slate-800, hover:bg-slate-900 (기존 black/gray 대신) */}
        <button
          onClick={onAddSummary}
          className="w-2/5 flex justify-center gap-1 px-4 py-1.5 bg-slate-800 text-white text-sm font-semibold rounded-full hover:bg-slate-900 transition"
        >
          <Plus className="w-5 h-5" /> 요지 추가하기
        </button>
      </div>
    </div>
  );
}