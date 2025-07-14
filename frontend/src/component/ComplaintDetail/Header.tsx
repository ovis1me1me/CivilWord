import { useNavigate } from 'react-router-dom';

interface Props {
  complaintId: number;
  title: string;
}

export default function Header({ complaintId, title }: Props) {
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-center mb-4 w-[997px] mx-auto">
      <div className="w-56 text-black text-xl font-semibold">{complaintId}. {title}</div>
      <button
        onClick={() => navigate('/complaints')}
        className="bg-black text-white px-4 py-2 rounded-lg"
      >
        목록으로
      </button>
    </div>
  );
}
