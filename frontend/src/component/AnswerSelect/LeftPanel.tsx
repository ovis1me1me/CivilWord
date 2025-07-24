interface Props {
  content: string;
}

export default function LeftPanel({ content }: Props) {
  return (
    <div className="flex-1 p-4 bg-zinc-300 rounded h-120 overflow-auto">
      <h3 className="font-semibold mb-2">민원 내용</h3>
      <p>{content}</p>
    </div>
  );
}
