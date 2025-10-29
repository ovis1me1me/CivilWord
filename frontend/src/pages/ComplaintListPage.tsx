import { useNavigate } from 'react-router-dom';
import FileUploader from '../component/ComplaintList/FileUploader';
import SortingDropdown from '../component/ComplaintList/SortingDropdown';
import ComplaintList from '../component/ComplaintList/ComplaintList';
import ComplaintListActions from '../component/ComplaintList/ComplaintListActions';
import { useComplaintData } from '../hooks/useComplaintData';
import { useEffect } from 'react';
import ComplaintFilter from '../component/ComplaintList/ComplaintFilter';
import ContentCenter from '../component/Common/ContentCenter';
import PageHeader from '../component/Common/PageHeader';
import { TableOfContents } from 'lucide-react';
// import { NavLink } from "react-router-dom"; // NavLink는 이 파일에서 사용되지 않네요.

export default function ComplaintListPage() {
  const {
    complaints,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    deleteSelected,
    downloadSelected,
    loadMore,
    sortOption,
    setSortOption,
    totalCount,
    displayedCount,
    loadComplaints,
    filterOption,
    setFilterOption,
  } = useComplaintData();

  const navigate = useNavigate();
  const hasSidebar = true;

  // ✅ HistoryPage와 동일한 로직을 위해 selectedCount 변수 생성
  const selectedCount =
    selectedIds instanceof Set ? selectedIds.size : selectedIds.length;

  const handleTitleClick = (id: number, answerStatus: string) => {
    if (answerStatus === '수정중' || answerStatus === '답변완료') {
      navigate(`/complaints/${id}/select-answer`);
    } else {
      navigate(`/complaints/${id}`);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('현재 토큰:', localStorage.getItem('token'));
  }, []);

  return (
    <div className="flex flex-col w-full min-h-screen bg-gradient-to-b from-blue-50 via-white to-white">
      {/* 상단 배너 */}
      <PageHeader
        title="민원 목록"
        hasSidebar={hasSidebar}
        icon={<TableOfContents size={31} className="text-white drop-shadow-md" />}
        maxWidthClass="max-w-[1000px]"
      />

      {/* 본문: 사이드바 보정 + 폭 통일 */}
      <ContentCenter hasSidebar={hasSidebar} maxWidthClass="max-w-[1000px]">
        <FileUploader onUploadSuccess={loadComplaints} />

        {/* ✅ HistoryPage 스타일의 액션 바로 변경 */}
        <div className="mt-3 flex items-center justify-between">
          {/* 왼쪽: 필터 및 정렬 */}
          <div className="flex items-center gap-2">
            <ComplaintFilter
              filterOption={filterOption}
              setFilterOption={setFilterOption}
            />
            <SortingDropdown
              sortOption={sortOption}
              setSortOption={setSortOption}
            />
          </div>

          {/* 오른쪽: 선택된 항목 액션 (HistoryPage와 동일한 스타일) */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 mr-2">
              선택: <span className="font-semibold">{selectedCount}</span>건
            </span>
            <button
              type="button"
              onClick={downloadSelected} // ✅ useComplaintData 훅의 함수 사용
              disabled={selectedCount === 0}
              className={`px-3 py-2 rounded-lg text-sm border shadow-sm transition
                ${
                  selectedCount === 0
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
            >
              다운로드
            </button>
            <button
              type="button"
              onClick={deleteSelected} // ✅ useComplaintData 훅의 함수 사용
              disabled={selectedCount === 0}
              className={`px-3 py-2 rounded-lg text-sm shadow-sm transition
                ${
                  selectedCount === 0
                    ? 'bg-red-100 text-white/70 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
            >
              선택민원 삭제
            </button>
          </div>
        </div>

        {/* ✅ HistoryPage와 동일한 스타일의 구분선 */}
        <div className="border-b-4 border-blue-900 rounded-sm shadow-sm mt-4 mb-4 opacity-90" />

        <ComplaintList
          complaints={complaints}
          selectedIds={selectedIds}
          toggleSelect={toggleSelect}
          toggleSelectAll={toggleSelectAll}
          onTitleClick={handleTitleClick}
        />

        {/* ✅ 이 컴포넌트는 이제 '더 보기' 기능만 담당 (관련 props만 전달) */}
        <ComplaintListActions
          loadMore={loadMore}
          totalCount={totalCount}
          displayedCount={displayedCount}
          // ❌ 삭제/다운로드/선택 관련 props는 제거
          // deleteSelected={deleteSelected}
          // downloadSelected={downloadSelected}
          // selectedCount={selectedCount}
        />
      </ContentCenter>
    </div>
  );
}