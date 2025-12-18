import { Fragment } from 'react'; // <Fragment> 사용을 위해 import

// ✅ Props: 더 보기 기능과 카운트 표시에 필요한 것만 남깁니다.
interface Props {
  loadMore: () => void;
  totalCount: number;
  displayedCount: number;
}

export default function ComplaintListActions({
  loadMore,
  totalCount,
  displayedCount,
}: Props) {
  // ✅ 더 볼 항목이 있는지 계산
  const hasMore = displayedCount < totalCount;

  return (
    <div className="flex flex-col items-center justify-center mt-6 mb-10 w-full gap-4">
      {/* 1. 더보기 버튼 */}
      {hasMore && (
        <button
          onClick={loadMore}
          className="flex items-center border border-slate-400 rounded-full px-6 py-3 text-slate-600 font-bold text-sm hover:bg-slate-100 transition shadow-sm"
        >
          더보기 ({totalCount - displayedCount} 건 남음)
        </button>
      )}

      {/* 2. 전체 카운트 표시 */}
      <div className="text-center text-sm text-slate-500">
        {totalCount > 0 ? (
          <Fragment>
            총 <span className="font-semibold text-slate-700">{totalCount}</span>
            건 중{' '}
            <span className="font-semibold text-slate-700">
              {displayedCount}
            </span>
            건 표시 중
          </Fragment>
        ) : (
          <span>표시할 민원이 없습니다.</span>
        )}
      </div>
    </div>
  );
}