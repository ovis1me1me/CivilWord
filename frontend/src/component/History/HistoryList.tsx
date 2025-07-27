import { useState } from 'react';
import { useHistoryData } from '../../hooks/useHistoryData';
import HistoryRow from './HistoryRow';
import LoadMoreButton from './LoadMoreButton';

// ✅ props 타입 정의
interface HistoryListProps {
  keyword: string;
}

export default function HistoryList({ keyword }: HistoryListProps) {
  const token = localStorage.getItem('token') || ''; // 실제로는 Context 권장
  const { history, loading, error } = useHistoryData(token, keyword);
  const [visibleCount, setVisibleCount] = useState(10);

  const handleLoadMore = () => setVisibleCount((prev) => prev + 10);

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="flex flex-col items-center">
      {history.slice(0, visibleCount).map((item, idx) => (
        <HistoryRow
          key={item.id}
          index={idx + 1}
          title={item.title}
          date={item.created_at}
          id={item.id}
        />
      ))}
      {visibleCount < history.length && (
        <div className="mt-4">
          <LoadMoreButton onClick={handleLoadMore} />
        </div>
      )}
    </div>
  );
}
