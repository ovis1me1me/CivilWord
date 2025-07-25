import { Plus, Minus } from 'lucide-react';
import React, { useRef, useEffect } from 'react';

interface AnswerBlockProps {
  index: number;
  summaryTitle: string; // 민원 요지
  answerOptions: string[]; // 답변 요지
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
  const labels = ['가', '나', '다', '라', '마', '바', '사', '아', '자', '차', '카', '타', '파', '하'];

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
      <div className="text-xl font-semibold text-black mb-2">
        <span>답변 요지{index > 0 ? `_${index + 1}` : ''}</span>
      </div>

      <div className="bg-gray-200 border rounded p-4 space-y-2">
        <div className="mb-1">
          <textarea
            ref={summaryTextareaRef}
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
            <button
              onClick={onAddAnswer}
              className="w-7 h-7 flex items-center text-white justify-center hover:text-green-500 hover:bg-white rounded-full flex-shrink-0"
              type="button"
              title="요지 추가"
            >
              <Plus className="w-6 h-6" />
            </button>

            <button
              onClick={() => onDeleteAnswer(i)}
              className="w-7 h-7 flex items-center text-white justify-center hover:text-red-500 hover:bg-white rounded-full flex-shrink-0"
              type="button"
              title="요지 삭제"
            >
              <Minus className="w-6 h-6" />
            </button>

            <span className="w-5 font-bold pt-2 flex-shrink-0">{labels[i] || '•'}.</span>
            <textarea
              // 이 부분을 수정했습니다.
              ref={(el: HTMLTextAreaElement | null) => {
                answerTextareaRefs.current[i] = el;
              }}
              value={option}
              onChange={(e) => onAnswerChange(i, e.target.value)}
              onInput={(e) => adjustTextareaHeight(e.currentTarget)}
              placeholder="답변의 요지를 입력하세요."
              className="flex-1 p-2 border border-gray-300 rounded-lg bg-white text-sm resize-none overflow-hidden"
              rows={1}
            />
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-4">
        <button
          onClick={onAddSummary}
          className="w-2/5 flex justify-center gap-1 px-4 py-1.5 bg-gray-400 text-white text-sm rounded-full hover:bg-gray-500"
        >
          <Plus className="w-5 h-5" /> 요지 추가하기
        </button>
      </div>
    </div>
  );
}