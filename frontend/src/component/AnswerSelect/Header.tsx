import { useNavigate } from 'react-router-dom';

interface Props {
  title: string;
}

export default function Header({ title }: Props) {
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-center mb-4 mx-auto">
      <div className="w-4/6 text-black text-2xl font-semibold underline underline-offset-4">{title}</div>
      <button
        onClick={() => navigate('/complaints')}
        className="w-1/6 bg-black text-white font-semibold px-2 py-1 rounded-lg hover:bg-zinc-600"
      >
        목록으로
      </button>
    </div>
  );
}
