import { Complaint } from '../../types/complaint';
import ComplaintRow from './ComplaintRow';

interface Props {
  complaints: Complaint[];
  selectedIds: number[];
  toggleSelect: (id: number) => void;
  toggleSelectAll: () => void;
  onTitleClick: (id: number, answerStatus: string) => void;
}

export default function ComplaintList({
  complaints,
  selectedIds,
  toggleSelect,
  toggleSelectAll,
  onTitleClick,
}: Props) {
  return (
    <div className="w-full">
      <div className="flex items-center bg-gray-100 p-2 rounded-lg mb-2">
        <input
          type="checkbox"
          onChange={toggleSelectAll}
          checked={selectedIds.length === complaints.length && complaints.length > 0}
          className="w-5 h-5 mx-2 accent-sky-500"
          aria-label="현재 표시된 항목 전체선택"
        />
        {/* 컬럼 너비 및 정렬 (HistoryList와 동일하게 유지) */}
        <span className="w-16 text-center font-semibold">번호</span>
        <span className="flex-1 text-center font-semibold">민원 제목</span>
        <span className="w-32 text-center font-semibold">답변 상태</span>
        <span className="w-32 text-center font-semibold">날짜</span>
      </div>

      {complaints.map((c, idx) => (
        <ComplaintRow
          key={c.id}
          idx={idx + 1}
          complaint={c}
          isSelected={selectedIds.includes(c.id)}
          onToggleSelect={() => toggleSelect(c.id)}
          onClickTitle={() => onTitleClick(c.id, c.reply_status)}
        />
      ))}
    </div>
  );
}