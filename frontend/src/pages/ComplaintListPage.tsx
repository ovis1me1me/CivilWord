import { useNavigate } from 'react-router-dom';
import FileUploader from '../component/ComplaintList/FileUploader';
import SortingDropdown from '../component/ComplaintList/SortingDropdown';
import ComplaintList from '../component/ComplaintList/ComplaintList';
import ComplaintListActions from '../component/ComplaintList/ComplaintListActions';
import { useComplaintData } from '../hooks/useComplaintData';
import { useEffect } from 'react';
import ComplaintFilter from '../component/ComplaintList/ComplaintFilter'; // ✅ 필터 컴포넌트 import
import ContentCenter from '../component/Common/ContentCenter';      // ✅ 추가
import PageHeader from '../component/Common/PageHeader';            // ✅ 추가
import { TableOfContents  } from 'lucide-react';     
import { NavLink } from "react-router-dom";

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
    filterOption,      // ✅ useComplaintData 훅에서 가져오기
    setFilterOption,   // ✅ useComplaintData 훅에서 가져오기
  } = useComplaintData();

  const navigate = useNavigate();
  const hasSidebar = true;

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

        <div className="flex justify-end mt-2">
          <ComplaintFilter 
            filterOption={filterOption} 
            setFilterOption={setFilterOption} 
          />
          <SortingDropdown 
            sortOption={sortOption} 
            setSortOption={setSortOption} 
          />
        </div>
        
        <div className="border-b-4 border-gov-900 rounded-sm shadow-sm mt-4 mb-4 opacity-90" />

        <ComplaintList
          complaints={complaints}
          selectedIds={selectedIds}
          toggleSelect={toggleSelect}
          toggleSelectAll={toggleSelectAll}
          onTitleClick={handleTitleClick}
        />

        <ComplaintListActions
          deleteSelected={deleteSelected}
          downloadSelected={downloadSelected}
          loadMore={loadMore}
          totalCount={totalCount}
          displayedCount={displayedCount}
          selectedCount={selectedIds instanceof Set ? selectedIds.size : selectedIds.length}
        />
      </ContentCenter>
    </div>
  );
}