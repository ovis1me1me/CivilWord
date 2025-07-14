import { useState, useEffect } from 'react';
import { getHistory, searchHistory } from '../utils/api';

export function useHistoryData(token: string, keyword?: string) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = keyword
          ? await searchHistory(token, keyword)
          : await getHistory(token);
        setHistory(response.data);
      } catch (err: any) {
        if (err.response && err.response.status === 404) {
          setHistory([]);
        } else {
          setError('히스토리 데이터를 불러오지 못했습니다.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [token, keyword]);

  return { history, loading, error };
}
