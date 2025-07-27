interface Props {
  content: string;
}

export default function LeftPanel({ content }: Props) {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">민원 내용</h3> {/* 박스 밖으로 이동 */}
      <div className="flex-1 p-4 bg-gray-200 rounded-lg h-[480px] overflow-auto">
        <p>{content}</p>
      </div>
    </div>
  );
}
