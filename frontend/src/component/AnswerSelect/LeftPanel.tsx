interface Props {
  content: string;
}

export default function LeftPanel({ content }: Props) {
  return (
    <div>
      {/* ✅ (수정) text-slate-800 적용 */}
      <h3 className="text-xl font-semibold mb-4 text-slate-800">민원 내용</h3>
      {/* ✅ (수정) bg-gray-200 -> bg-slate-50, border 추가, 텍스트 색상 변경 */}
      <div className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-lg h-[480px] overflow-auto">
        <p className="text-slate-700">{content}</p>
      </div>
    </div>
  );
}