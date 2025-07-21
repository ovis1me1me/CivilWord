import { useCallback, useEffect, useState } from 'react';
import { fetchComplaints, deleteComplaint, downloadSelectedComplaints, moveToHistory } from '../utils/api';
import { Complaint } from '../types/complaint';

export function useComplaintData() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [sortOption, setSortOption] = useState<'기본' | '날짜 오름' | '날짜 내림'>('기본');
  const [totalCount, setTotalCount] = useState(0);

  // ✅ complaints.length로 화면에 표시 중인 개수
  const displayedCount = complaints.length;

  // ✅ 민원 목록 불러오기 함수 (페이지네이션 지원)
  const loadComplaints = useCallback(
    async (skip = 0) => {
      try {
        const res = await fetchComplaints({
          sort:
            sortOption === '날짜 오름'
              ? 'created_asc'
              : sortOption === '날짜 내림'
              ? 'created_desc'
              : 'default',
          limit: 10,
          skip,
        });
        console.log('서버 응답:', res.data);
        if (skip === 0) {
          // 초기 로딩 or 새로고침
          setComplaints(res.data.complaints);
        } else {
          // 더보기
          setComplaints((prev) => [...prev, ...res.data.complaints]);
        }
        setTotalCount(res.data.total);
      } catch (err) {
        console.error('목록 불러오기 실패', err);
      }
    },
    [sortOption],
  );

  // ✅ 첫 렌더링 + 정렬 변경될 때 목록 로딩
  useEffect(() => {
    loadComplaints(0);
  }, [loadComplaints]);

  // ✅ 선택한 민원 toggle
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  // ✅ 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedIds.length === complaints.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(complaints.map((c) => c.id));
    }
  };

  // ✅ 선택한 민원 삭제
  const deleteSelected = async () => {
    if (window.confirm('선택한 민원을 삭제하시겠습니까?')) {
      for (const id of selectedIds) {
        await deleteComplaint(id);
      }
      await loadComplaints(0);
      setSelectedIds([]);
    }
  };

  // ✅ 선택한 민원 다운로드 + 히스토리 이동
  const downloadSelected = async () => {
    if (
      window.confirm(
        '다운로드 된 민원은 민원 목록에서 삭제 후 히스토리로 이동됩니다.\n선택한 민원을 다운로드하시겠습니까?'
      )
    ) {
      try {
        const res = await downloadSelectedComplaints(selectedIds);

        // 다운로드 처리
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'complaints.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();

        // 히스토리로 이동
        await moveToHistory(selectedIds);

        // 히스토리 페이지로 리디렉션
        window.location.href = '/complaints/history';
      } catch (err) {
        console.error('다운로드/히스토리 이동 실패', err);
        alert('다운로드/히스토리 이동 실패!');
      }
    }
  };

  // ✅ 더보기 버튼
  const loadMore = () => {
    loadComplaints(complaints.length);
  };

  // ✅ 최종 반환 (컴포넌트에서 필요한 것만 깔끔하게 반환!)
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
    totalCount,        // ✅ 실제 DB 전체 개수
    displayedCount,    // ✅ 현재까지 로드된 개수 (화면 표시 개수)
    loadComplaints,    // ✅ 파일 업로드 성공 시 reload 용
  };
}
