interface Props {
  summary: string;
  answerSummary: string;
  setAnswerSummary: (v: string) => void;
  onRegenerate: () => void;
  isGenerating: boolean;
}

export default function RightPanel({
  summary,
  answerSummary,
  setAnswerSummary,
  onRegenerate,
  isGenerating,
}: Props) {
  return (
    <div className="flex-1 flex flex-col h-94 p-4 bg-white rounded relative">
      <h3 className="text-base font-semibold mb-1">민원 요지</h3>
      <div className="bg-zinc-300 p-2 mb-2 rounded h-28 overflow-auto">{summary}</div>
      <h3 className="text-base font-semibold mb-1">답변 요지</h3>
      <textarea
        value={answerSummary}
        onChange={(e) => setAnswerSummary(e.target.value)}
        rows={4}
        className="w-full bg-zinc-300 p-2 rounded h-36 resize-none"
      />
      <button
        onClick={onRegenerate}
        disabled={isGenerating}
        className={`absolute bottom-0 right-4 px-4 py-2 text-sm font-semibold rounded ${
          isGenerating ? 'bg-gray-400' : 'bg-black'
        } text-white`}
      >
        {isGenerating ? '재생성 중...' : '답변 재생성'}
      </button>
    </div>
  );
}
