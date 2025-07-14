import { useEffect, useState } from 'react';
import { fetchAllRepliesAdmin } from '../utils/api';

export default function AdminRepliesPage() {
  const [replies, setReplies] = useState([]);

  useEffect(() => {
    const fetchReplies = async () => {
      try {
        const res = await fetchAllRepliesAdmin();
        console.log('전체 답변:', res.data);
        setReplies(res.data);
      } catch (err) {
        console.error(err);
        alert('관리자용 전체 답변 조회 실패!');
      }
    };

    fetchReplies();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">관리자용 전체 답변 목록</h1>
      <ul>
        {replies.map((reply: any) => (
          <li key={reply.id}>{reply.content}</li>
        ))}
      </ul>
    </div>
  );
}
