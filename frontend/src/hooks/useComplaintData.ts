import { useCallback, useEffect, useState } from 'react';
import { fetchComplaints, deleteComplaint, downloadSelectedComplaints, moveToHistory } from '../utils/api';
import { Complaint } from '../types/complaint';

// ✅ 필터 옵션에 대한 타입을 명확하게 정의합니다.
export type FilterOption = '전체' | '답변전' | '수정중' | '답변완료';

export function useComplaintData() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [sortOption, setSortOption] = useState<'기본' | '날짜 오름' | '날짜 내림'>('기본');
  const [filterOption, setFilterOption] = useState<FilterOption>('전체');
  const [totalCount, setTotalCount] = useState(0);
  const displayedCount = complaints.length;

  const loadComplaints = useCallback(
  async (skip = 0) => {
    try {
      const params: Record<string, any> = {
        sort:
          sortOption === '날짜 오름'
            ? 'created_asc'
            : sortOption === '날짜 내림'
            ? 'created_desc'
            : 'default',
        limit: 10,
        skip,
      };

      // ✅ '전체'가 아닐 경우에만 status 파라미터로 추가
      if (filterOption !== '전체') {
        params.status = filterOption;
      }

      console.log('📌 요청 파라미터:', params); // ← 확인용

      const res = await fetchComplaints(params);

      if (skip === 0) {
        setComplaints(res.data.complaints);
      } else {
        setComplaints((prev) => [...prev, ...res.data.complaints]);
      }
      setTotalCount(res.data.total);
    } catch (err) {
      console.error('목록 불러오기 실패', err);
    }
  },
  [sortOption, filterOption],
);


  useEffect(() => {
    // 정렬 또는 필터 옵션이 변경되면 목록을 처음부터 다시 불러옵니다.
    loadComplaints(0);
  }, [loadComplaints]); // loadComplaints는 sortOption, filterOption에 의존하므로 이대로 충분합니다.

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === complaints.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(complaints.map((c) => c.id));
    }
  };

  const deleteSelected = async () => {
    if (window.confirm('선택한 민원을 삭제하시겠습니까?')) {
      for (const id of selectedIds) {
        await deleteComplaint(id);
      }
      await loadComplaints(0);
      setSelectedIds([]);
    }
  };

  const downloadSelected = async () => {
    if (
      window.confirm(
        '다운로드 된 민원은 민원 목록에서 삭제 후 히스토리로 이동됩니다.\n선택한 민원을 다운로드하시겠습니까?'
      )
    ) {
      try {
        const res = await downloadSelectedComplaints(selectedIds);
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'complaints.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
        await moveToHistory(selectedIds);
        window.location.href = '/complaints/history';
      } catch (err) {
        console.error('다운로드/히스토리 이동 실패', err);
        alert('다운로드/히스토리 이동 실패!');
      }
    }
  };

  const loadMore = () => {
    loadComplaints(complaints.length);
  };

  return {
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
    // ✅ 4. 외부 컴포넌트(ComplaintListPage)에서 사용할 수 있도록 filter 상태와 세터를 반환합니다.
    filterOption,
    setFilterOption,
  };
}