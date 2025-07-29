import { useState } from 'react';
import HistoryHeader from '../component/History/HistoryHeader';
import HistoryList from '../component/History/HistoryList';
import { Link, useNavigate } from 'react-router-dom';

export default function HistoryPage() {
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center bg-white w-full h-full">
      <div className="mt-10">
        <HistoryHeader keyword={keyword} setKeyword={setKeyword} />
      </div>
      <div className="mt-6">
        <HistoryList keyword={keyword} />
      </div>
    </div>
  );
}
