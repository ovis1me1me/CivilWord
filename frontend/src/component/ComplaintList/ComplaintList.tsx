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
    <div className="mt-4 ml-[250px] p-4"> {/* 사이드 바 고려하여 중앙 위치*/}
      {/* Header */}
      <div className="flex items-center bg-gray-100 p-2 rounded mb-2">
        <input
          type="checkbox"
          onChange={toggleSelectAll}
          checked={selectedIds.length === complaints.length && complaints.length > 0}
          className="accent-sky-500 mr-3 w-4 h-4" // w-4 h-4 추가
        />
        <span className="flex-1 font-semibold">번호</span>
        <span className="flex-1 font-semibold">민원 제목</span>
        <span className="w-24 text-center font-semibold">답변 상태</span>
        <span className="w-24 text-center font-semibold">날짜</span>
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
