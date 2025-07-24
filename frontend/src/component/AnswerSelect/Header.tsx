import { useNavigate } from 'react-router-dom';

interface Props {
  title: string;
}

export default function Header({ title }: Props) {
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-center w-full border-b border-gray-200 pb-2">
      <div className="text-xl font-semibold">{title}</div>
      <button
        onClick={() => navigate('/complaints')}
        className="bg-black text-white rounded-lg px-4 py-2 text-sm"
      >
        목록으로
      </button>
    </div>
  );
}
