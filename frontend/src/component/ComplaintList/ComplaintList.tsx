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
      {/* ✅ Header: 스타일 변경 */}
      {/* 1. bg-gray-100, rounded-lg, mb-2, p-2 제거
          2. h-[40px], px-4 (Row와 맞춤)
          3. border-b-2 border-gray-300 (더 굵은 경계선)
          4. text-slate-600 (배경이 없으므로 텍스트 색상 지정)
      */}
      <div className="flex items-center h-[40px] px-4 border-b-2 border-gray-300 text-slate-600">
        <input
          type="checkbox"
          onChange={toggleSelectAll}
          checked={selectedIds.length === complaints.length && complaints.length > 0}
          className="w-5 h-5 mx-2 accent-sky-500"
          aria-label="현재 표시된 항목 전체선택"
        />
        {/* 컬럼 너비 및 정렬 (HistoryList와 동일하게 유지) */}
        <span className="w-16 text-center font-semibold">번호</span>
        <span className="flex-1 text-center font-semibold px-2">민원 제목</span>
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