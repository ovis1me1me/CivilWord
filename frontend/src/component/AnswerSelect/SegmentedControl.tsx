interface Props {
  selected: '생성된 답변' | '유사 민원 답변';
  setSelected: (v: '생성된 답변' | '유사 민원 답변') => void;
}

export default function SegmentedControl({ selected, setSelected }: Props) {
  return (
    <div className="flex gap-2 bg-neutral-100 rounded p-1">
      {['생성된 답변', '유사 민원 답변'].map((option) => (
        <div
          key={option}
          onClick={() => setSelected(option as '생성된 답변' | '유사 민원 답변')}
          className={`px-3 py-1 text-sm rounded cursor-pointer ${
            selected === option ? 'bg-white shadow' : ''
          }`}
        >
          {option}
        </div>
      ))}
    </div>
  );
}
