import { Complaint } from '../../types/complaint';

interface Props {
  idx: number;
  complaint: Complaint;
  isSelected: boolean;
  onToggleSelect: () => void;
  onClickTitle: () => void;
}

export default function ComplaintRow({
  idx,
  complaint,
  isSelected,
  onToggleSelect,
  onClickTitle,
}: Props) {
  const formattedDate = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(complaint.created_at));

  return (
    <div
      className={`h-[40px] flex items-center px-4 border-b border-gray-200 hover:bg-gray-50 transition
      ${isSelected ? 'bg-blue-50' : 'bg-white'}
      `}
    >
      {/* 1. 선택 체크박스 */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggleSelect}
        // ✅ 스타일 통일: (mr-2 w-4 h-4) -> (w-5 h-5 mx-2)
        className="accent-sky-500 w-5 h-5 mx-2 flex-shrink-0"
      />

      {/* 2. 번호 */}
      <div className="w-16 text-black text-base font-semibold text-center">
        {idx}
      </div>

      {/* 3. 민원 제목 */}
      <div
        className="flex-1 text-black text-base text-left px-4 hover:underline hover:underline-offset-2 cursor-pointer truncate"
        onClick={onClickTitle}
        title={complaint.title}
      >
        {complaint.title}
      </div>

      {/* 4. 답변 상태 */}
      <div className="w-32 text-center text-black text-base">
        {complaint.reply_status}
      </div>

      {/* 5. 날짜 */}
      <div className="w-32 text-center text-black text-base">
        {formattedDate}
      </div>
    </div>
  );
}