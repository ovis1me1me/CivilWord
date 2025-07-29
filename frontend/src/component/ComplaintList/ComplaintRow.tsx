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
  // 날짜 형식: "2025. 07. 21."
  const formattedDate = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(complaint.created_at));

  return (
    <div className="flex items-center bg-zinc-300 p-2 rounded-lg mb-2 hover:bg-zinc-400 transition cursor-pointer">
      {/* 선택 체크박스 */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggleSelect}
        className="accent-sky-500 mr-2 w-4 h-4"
      />

      {/* 번호 */}
      <div className="w-8 text-center font-semibold">{idx}</div>

      {/* 민원 제목 */}
      <div
        className="flex-1 pl-3 hover:underline hover:underline-offset-2"
        onClick={onClickTitle}
      >
        {complaint.title}
      </div>

      {/* 답변 상태 */}
      <div className="w-24 text-center">{complaint.reply_status}</div>

      {/* 날짜 */}
      <div className="w-24 text-center">{formattedDate}</div>
    </div>
  );
}
