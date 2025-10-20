// component/History/HistoryList.tsx
import { useMemo } from 'react';

interface HistoryItem {
  id: number;
  title: string;
  created_at?: string;
  rating?: number; // 점수 데이터
  reply_status?: string;
}

interface HistoryListProps {
  keyword: string;
  history: HistoryItem[];
  loading: boolean;
  error: string | null;
  visibleCount: number;
  totalCount: number;
  displayedCount: number;
  selectedIds: Set<number>;
  toggleSelect: (id: number) => void;
  toggleSelectAll: () => void;
  loadMore: () => void;
  onTitleClick?: (id: number, replyStatus?: string) => void;
}

export default function HistoryList({
  keyword,
  history,
  loading,
  error,
  visibleCount,
  totalCount,
  displayedCount,
  selectedIds,
  toggleSelect,
  toggleSelectAll,
  loadMore,
  onTitleClick,
}: HistoryListProps) {
  const rows = useMemo(() => history.slice(0, visibleCount), [history, visibleCount]);
  const allDisplayedChecked = rows.length > 0 && rows.every((r) => selectedIds.has(r.id));

  // ✅ 별점 시각화 함수 (SVG 직접 사용)
  const renderStars = (score: number = 0) => {
    const totalStars = 3;
    return (
      <div className="flex justify-center items-center space-x-1">
        {Array.from({ length: totalStars }, (_, i) => {
          const isFilled = i < score;
          return (
            <svg
              key={i}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className={
                isFilled
                  ? 'w-4 h-4 fill-yellow-400 stroke-yellow-400' // 채워진 별 (크기 조절)
                  : 'w-4 h-4 fill-none stroke-gray-400'      // 빈 별 (크기 조절)
              }
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
              />
            </svg>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* 인덱스 헤더 */}
      <div className="flex items-center bg-gray-100 p-2 rounded-lg mb-2">
        <input
          type="checkbox"
          className="w-5 h-5 mx-2"
          aria-label="현재 표시된 항목 전체선택"
          onChange={toggleSelectAll}
          checked={allDisplayedChecked}
        />
        <span className="w-16 text-center font-semibold">번호</span>
        <span className="flex-1 text-center font-semibold px-2">민원 제목</span>
        <span className="w-32 text-center font-semibold">답변 점수</span>
        <span className="w-32 text-center font-semibold">날짜</span>
      </div>

      {/* 본문 */}
      {loading ? (
        <div className="border rounded-lg p-4 text-gray-500">로딩 중...</div>
      ) : error ? (
        <div className="border rounded-lg p-4 text-red-600">{error}</div>
      ) : rows.length === 0 ? (
        <div className="border rounded-lg p-6 text-center text-gray-500">
          표시할 히스토리가 없습니다.
        </div>
      ) : (
        <>
          {rows.map((item, idx) => (
            <div
              key={item.id}
              className="flex items-center border-b p-2 hover:bg-gray-50"
            >
              <input
                type="checkbox"
                className="w-5 h-5 mx-2"
                checked={selectedIds.has(item.id)}
                onChange={() => toggleSelect(item.id)}
                aria-label={`선택: ${item.title}`}
              />

              <span className="w-16 text-center text-sm">{idx + 1}</span>

              <button
                type="button"
                onClick={() => onTitleClick?.(item.id, item.reply_status)}
                className="flex-1 text-left px-2 truncate hover:underline"
                title={item.title}
              >
                {item.title}
              </button>

              {/* 점수 (✅ 수정된 부분) */}
              <div className="w-32 flex justify-center">
                {renderStars(item.rating)}
              </div>

              {/* 날짜 */}
              <span className="w-32 text-center text-sm">
                {item.created_at?.slice(0, 10) ?? '-'}
              </span>
            </div>
          ))}

          {displayedCount < totalCount && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                className="px-4 py-2 rounded-lg border bg-white hover:bg-slate-50"
              >
                더 보기
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}