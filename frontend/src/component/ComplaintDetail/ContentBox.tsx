interface Props {
  label?: string;
  content: string;
}

export default function ContentBox({ label, content }: Props) {
  return (
    <div className="mb-6">
      <h3 className="text-xl font-semibold text-slate-800 mb-2">{label}</h3>
      <div className="min-h-[7rem] bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-y-auto">
        <p className="text-slate-700 whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}