import { useNavigate } from 'react-router-dom';
import FileUploader from '../component/ComplaintList/FileUploader';
import SortingDropdown from '../component/ComplaintList/SortingDropdown';
import ComplaintList from '../component/ComplaintList/ComplaintList';
import ComplaintListActions from '../component/ComplaintList/ComplaintListActions';
import { useComplaintData } from '../hooks/useComplaintData';
import { useEffect } from 'react';
import ComplaintFilter from '../component/ComplaintList/ComplaintFilter'; // ✅ 필터 컴포넌트 import

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
    <div className="p-4 max-w-6xl mx-auto">
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
    </div>
  );
}