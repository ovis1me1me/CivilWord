import { useMemo, useState, useEffect } from 'react';
import { BookOpenText } from 'lucide-react';
import HistoryHeader from '../component/History/HistoryHeader';
import HistoryList from '../component/History/HistoryList';
import ContentCenter from '../component/Common/ContentCenter';
import SortingDropdown from '../component/History/SortingDropdown';
import { useNavigate } from 'react-router-dom';
import { useHistoryData } from '../hooks/useHistoryData';
import {
  deleteHistoryItems,
  downloadSelectedHistories,
  downloadBlob,
} from '../utils/api';

export default function HistoryPage() {
  const [keyword, setKeyword] = useState('');
  const hasSidebar = true;
  const token = useMemo(() => localStorage.getItem('token') || '', []);

  const {
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
    loadHistory,
    sortOption,
    setSortOption, // ✅ 훅 내부 상태 사용
  } = useHistoryData(token, keyword);

  const navigate = useNavigate();

  const handleTitleClick = (id: number) => navigate(`/history/${id}`);

  useEffect(() => {
    loadHistory();
  }, [sortOption, loadHistory]); // ✅ 정렬 변경 시 reload

  const handleDeleteSelected = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    try {
      await deleteHistoryItems(ids);
      await loadHistory();
    } catch {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleDownloadSelected = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    try {
      const resp = await downloadSelectedHistories(ids);
      downloadBlob(
        resp.data,
        `히스토리_선택민원_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
    } catch {
      alert('다운로드 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-gradient-to-b from-blue-50 via-white to-white">
      <div className="w-full bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 shadow-md py-6 mb-6">
        <ContentCenter hasSidebar={hasSidebar}>
          <div className="flex items-center gap-3">
            <BookOpenText size={32} className="text-white drop-shadow-md" />
            <h2 className="text-3xl font-bold text-white tracking-tight">히스토리 목록</h2>
          </div>
        </ContentCenter>
      </div>

      <ContentCenter hasSidebar={hasSidebar}>
        <HistoryHeader keyword={keyword} setKeyword={setKeyword} />

        <div className="mt-3 flex items-center justify-between">
          <SortingDropdown sortOption={sortOption} setSortOption={setSortOption} />
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 mr-2">
              선택: <span className="font-semibold">{selectedIds.size}</span>건
            </span>
            <button
              type="button"
              onClick={handleDownloadSelected}
              disabled={selectedIds.size === 0}
              className={`px-3 py-2 rounded-lg text-sm border shadow-sm transition
                ${selectedIds.size === 0
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
            >
              다운로드
            </button>
            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={selectedIds.size === 0}
              className={`px-3 py-2 rounded-lg text-sm shadow-sm transition
                ${selectedIds.size === 0
                  ? 'bg-red-100 text-white/70 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
                }`}
            >
              선택민원 삭제
            </button>
          </div>
        </div>

        <div className="border-b-4 border-blue-900 rounded-sm shadow-sm mt-4 mb-4 opacity-90" />

        <HistoryList
          keyword={keyword}
          history={history}
          loading={loading}
          error={error}
          visibleCount={visibleCount}
          totalCount={totalCount}
          displayedCount={displayedCount}
          selectedIds={selectedIds}
          toggleSelect={toggleSelect}
          toggleSelectAll={toggleSelectAll}
          loadMore={loadMore}
          onTitleClick={handleTitleClick}
        />
      </ContentCenter>
    </div>
  );
}
