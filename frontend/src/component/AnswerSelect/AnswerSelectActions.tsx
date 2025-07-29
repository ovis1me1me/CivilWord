interface Props {
  onReselect: () => void;
  onHold: () => void;
  onComplete: () => void;
}

export default function AnswerSelectActions({ onReselect, onHold, onComplete }: Props) {
  return (
    <div className="flex justify-end gap-2 mt-4">
      <button onClick={onReselect} className="w-20 h-10 bg-black text-white font-semibold rounded-lg text-sm hover:bg-zinc-600">다시 선택</button>
      <button onClick={onHold} className="w-20 h-10 bg-black text-white font-semibold rounded-lg text-sm hover:bg-zinc-600">답변 보류</button>
      <button onClick={onComplete} className="w-20 h-10 bg-black text-white font-semibold rounded-lg text-sm hover:bg-zinc-600">답변 완료</button>
    </div>
  );
}
