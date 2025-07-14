interface Props {
  answerSummary: string;
  setAnswerSummary: (v: string) => void;
  readOnly?: boolean;
}

export default function AnswerTextarea({
  answerSummary,
  setAnswerSummary,
  readOnly = false, // ✅ 기본값 false
}: Props) {
  return (
    <div className="mb-6">
      <h3 className="text-xl font-semibold text-black mb-2">3) 답변 요지</h3>
      <textarea
        value={answerSummary}
        onChange={(e) => setAnswerSummary(e.target.value)}
        readOnly={readOnly} // ✅ 추가
        rows={4}
        placeholder="답변의 요지를 입력하세요."
        className="w-full h-36 bg-zinc-300 rounded p-3 focus:outline-none focus:ring-2 focus:ring-sky-300 transition"
      />
    </div>
  );
}
