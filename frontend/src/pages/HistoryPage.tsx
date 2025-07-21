import { useState } from 'react';
import HistoryHeader from '../component/History/HistoryHeader';
import HistoryList from '../component/History/HistoryList';
import { Link, useNavigate } from 'react-router-dom';

export default function HistoryPage() {
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();

  return (
    <div className="ml-[250px] p-4"> {/*7/20 사이드 바 고려하여 중앙 위치 */}
      <div className="flex flex-col items-center bg-white w-full h-full">
        <div className="mt-10">
          <HistoryHeader keyword={keyword} setKeyword={setKeyword} />
        </div>
        <div className="mt-6">
          <HistoryList keyword={keyword} />
        </div>
        <button
          onClick={() => navigate('/complaints')}
          className="w-1/6 bg-black text-white font-bold px-4 py-2 rounded-lg hover:bg-gray-800 transition fixed bottom-4 right-4"
        > {/*7/20 w-1/6 추가*/}
          목록으로
        </button>
      </div>
    </div>
  );
}
