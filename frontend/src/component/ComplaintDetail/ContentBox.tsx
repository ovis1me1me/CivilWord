interface Props {
  label?: string;
  content: string;
}

export default function ContentBox({ label, content }: Props) {
  return (
    <div className="mb-6">
      {/* ✅ text-slate-800: 검은색보다 부드러운 헤더 */}
      <h3 className="text-xl font-semibold text-slate-800 mb-2">{label}</h3>

      {/* ✅ (수정)
        1. 배경색: bg-slate-50 (모던한 연회색)
        2. 테두리: border-slate-200
      */}
      <div className="min-h-[7rem] bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-y-auto">
        {/* ✅ text-slate-700: 본문 텍스트 */}
        <p className="text-slate-700 whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}