import { useState, useEffect, useCallback, useMemo } from 'react';
import { getHistory, searchHistory } from '../utils/api';

export interface HistoryItem {
  id: number;
  title: string;
  created_at?: string;
  rating?: number;
  answer_score?: number;
}

// ✅ 정렬 옵션 타입
export type SortOption = '기본' | '날짜 오름' | '날짜 내림' | '평가 높은순' | '평가 낮은순';

export function useHistoryData(token: string, keyword?: string) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('기본'); // ✅ 훅 내부 상태로 이동

  const [visibleCount, setVisibleCount] = useState(10);
  const totalCount = history.length;
  const displayedCount = Math.min(visibleCount, totalCount);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev => {
      const slice = history.slice(0, displayedCount);
      const allChecked = slice.length > 0 && slice.every(h => prev.has(h.id));
      if (allChecked) return new Set();
      const next = new Set<number>();
      slice.forEach(h => next.add(h.id));
      return next;
    });
  }, [history, displayedCount]);

  const loadMore = useCallback(() => setVisibleCount(v => v + 10), []);

  const parseItems = useCallback((data: any): HistoryItem[] => {
    const raw: any[] = Array.isArray(data) ? data : (data?.items ?? []);
    if (!raw) return [];
    return raw.map(it => ({
      ...it,
      rating: it?.rating ?? it?.answer_score ?? undefined,
    }));
  }, []);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = keyword
        ? await searchHistory(token, keyword)
        : await getHistory(token);
      const items = parseItems(resp.data);
      setHistory(items);
      setVisibleCount(10);
      setSelectedIds(new Set());
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setHistory([]);
      } else {
        setError('히스토리 데이터를 불러오지 못했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }, [token, keyword, parseItems]);

  // ✅ 정렬 적용
  const sortedHistory = useMemo(() => {
    const sorted = [...history];
    switch (sortOption) {
      case '날짜 오름':
        sorted.sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''));
        break;
      case '날짜 내림':
        sorted.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
        break;
      case '평가 높은순':
        sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case '평가 낮은순':
        sorted.sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));
        break;
      default:
        break;
    }
    return sorted;
  }, [history, sortOption]);

  return {
    history: sortedHistory,
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
    // ✅ 정렬 관련
    sortOption,
    setSortOption,
  };
}
