interface Props {
  label?: string;
  content: string;
}

export default function ContentBox({ label, content }: Props) {
  return (
    <div className="mb-6">
      <h3 className="text-xl font-semibold text-black mb-2">{label}</h3>
      <div className="h-28 bg-gray-200 rounded-lg p-3 overflow-y-auto">
        <p className="text-black whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}
