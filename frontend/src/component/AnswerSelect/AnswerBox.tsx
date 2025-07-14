interface Props {
  content: string;
  isSelected: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onChange: (v: string) => void;
}

export default function AnswerBox({
  content,
  isSelected,
  isEditing,
  onEdit,
  onChange,
}: Props) {
  return (
    <div
      className={`relative p-4 rounded bg-zinc-300 h-80 flex-1 overflow-auto border ${
        isSelected ? 'border-blue-500' : 'border-transparent'
      }`}
    >
      {isEditing ? (
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-full p-2 rounded bg-white resize-none"
        />
      ) : (
        <p>{content}</p>
      )}

      {isEditing && (
        <button
          onClick={() => navigator.clipboard.writeText(content)}
          className="absolute bottom-4 right-4 text-xs bg-black text-white rounded px-2 py-1"
        >
          복사
        </button>
      )}

      {!isEditing && (
        <div
          onClick={onEdit}
          className="absolute inset-0 bg-black bg-opacity-30 flex items-end justify-center text-white text-xs cursor-pointer opacity-0 hover:opacity-80 transition-opacity rounded"
        >
          <div className="mb-2">클릭 시 선택</div>
        </div>
      )}
    </div>
  );
}
