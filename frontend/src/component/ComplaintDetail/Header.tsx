import { useNavigate } from 'react-router-dom';

interface Props {
  title: string;
}

export default function Header({ title }: Props) {
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-center mb-4 w-[997px] mx-auto">
      <div className="w-4/6 text-black text-xl font-semibold">{title}</div>
      <button
        onClick={() => navigate('/complaints')}
        className="w-1/6 bg-black text-white px-2 py-1 rounded-lg"
      >
        목록으로
      </button>
    </div>
  );
}
