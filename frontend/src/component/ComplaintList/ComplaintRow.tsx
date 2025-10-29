import { Complaint } from '../../types/complaint';

interface Props {
  idx: number;
  complaint: Complaint;
  isSelected: boolean;
  onToggleSelect: () => void;
  onClickTitle: () => void;
}

// ✅ YYYY-MM-DD 포맷터
const formatYYYYMMDD = (input: string | Date) => {
  const d = new Date(input);
  if (isNaN(d.getTime())) return '-';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export default function ComplaintRow({
  idx,
  complaint,
  isSelected,
  onToggleSelect,
  onClickTitle,
}: Props) {
  const formattedDate = formatYYYYMMDD(complaint.created_at);

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
        className="accent-sky-500 mr-2 w-5 h-5 flex-shrink-0"
      />

      {/* 2. 번호 */}
      <div className="w-16 text-black text-base font-semibold text-center">
        {idx}
      </div>

      {/* 3. 민원 제목 */}
      <div
        className="flex-1 text-black text-base text-left px-2 hover:underline hover:underline-offset-2 cursor-pointer truncate"
        onClick={onClickTitle}
        title={complaint.title}
      >
        {complaint.title}
      </div>

      {/* 4. 답변 상태 */}
      <div className="w-32 text-center text-black text-base pl-4">
        {complaint.reply_status}
      </div>

      {/* 5. 날짜 (YYYY-MM-DD) */}
      <div className="w-32 text-center text-black text-base pl-4">
        {formattedDate}
      </div>
    </div>
  );
}
