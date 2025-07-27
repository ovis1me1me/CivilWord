interface Props {
  deleteSelected: () => void;
  downloadSelected: () => void;
  loadMore: () => void;
  totalCount: number;
  displayedCount: number;
}

export default function ComplaintListActions({
  deleteSelected,
  downloadSelected,
  loadMore,
  totalCount,
  displayedCount,
}: Props) {
  return (
    <div className="flex flex-col items-center mt-4 gap-4 ml-[250px]"> {/* 사이드 바 고려하여 중앙 위치*/}
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
      <div className="flex justify-between w-full">
        <button
          onClick={deleteSelected}
          className="bg-black text-white font-bold px-4 py-2 rounded-lg hover:bg-zinc-600 transition"
        >
          선택 민원 삭제
        </button>
        <button
          onClick={downloadSelected}
          className="bg-sky-500 text-white font-bold px-4 py-2 rounded-lg hover:bg-sky-300 transition"
        >
          선택 민원 다운로드
        </button>
      </div>
    </div>
  );
}
