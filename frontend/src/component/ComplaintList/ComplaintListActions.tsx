interface Props {
  deleteSelected: () => void;
  downloadSelected: () => void;
  loadMore: () => void;
  totalCount: number;
  displayedCount: number;/** ✅ 추가: 현재 선택 개수 */
  selectedCount?: number;
  /** (선택) 진행 중 처리 표시를 원하면 붙이세요 */
  isProcessing?: boolean;
}

export default function ComplaintListActions({
  deleteSelected,
  downloadSelected,
  loadMore,
  totalCount,
  displayedCount,
  selectedCount = 0,
  isProcessing = false,
}: Props) {
  const hasMore = displayedCount < totalCount;
  const disabled = selectedCount === 0 || isProcessing;

  return (
    <div className="flex flex-col items-center mt-4 gap-4"> {/* 사이드 바 고려하여 중앙 위치*/}
      <div className="flex justify-center w-full">
        {displayedCount < totalCount && (
          <button
            onClick={loadMore}
            className="flex items-center border border-slate-500 rounded-full px-6 py-3 text-slate-500 font-bold text-sm hover:bg-slate-200 transition"
          >
            더보기 ({totalCount - displayedCount} 남음)
          </button>
        )}
      </div>
      
      <div className="flex justify-between w-full gap-2">
        {/* 삭제 버튼 */}
        <button
          onClick={disabled ? undefined : deleteSelected}
          disabled={disabled}
          title={selectedCount === 0 ? '선택된 항목이 없습니다' : '선택 항목 삭제'}
          className={`relative bg-black text-white font-bold px-4 py-2 rounded-lg transition
            ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-zinc-600'}`}
          aria-disabled={disabled}
        >
          선택 민원 삭제
          {/* ✅ 선택 개수 배지 */}
          <span
            className={`ml-2 inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full text-xs font-bold
              ${disabled ? 'bg-zinc-400 text-white' : 'bg-white text-black'}`}
          >
            {selectedCount}
          </span>
        </button>

        {/* 다운로드 버튼 */}
        <button
          onClick={disabled ? undefined : downloadSelected}
          disabled={disabled}
          title={selectedCount === 0 ? '선택된 항목이 없습니다' : '선택 항목 다운로드'}
          className={`relative bg-sky-500 text-white font-bold px-4 py-2 rounded-lg transition
            ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-sky-400'}`}
          aria-disabled={disabled}
        >
          선택 민원 다운로드
          {/* ✅ 선택 개수 배지 */}
          <span
            className={`ml-2 inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full text-xs font-bold
              ${disabled ? 'bg-sky-300 text-white' : 'bg-white text-sky-600'}`}
          >
            {selectedCount}
          </span>
        </button>
      </div>
    </div>
  );
}
