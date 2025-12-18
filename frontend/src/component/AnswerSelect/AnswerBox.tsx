import React from "react";
import { Plus, Trash2 } from "lucide-react"; // 🔹 추가

interface Section {
  id: string;
  text: string;
}

interface ContentBlock {
  id: string;
  title: string;
  sections: Section[];
}

interface FullAnswer {
  header: string;
  summary: string;
  body: ContentBlock[];
  footer: string;
}

const createNewSection = (): Section => ({
  id: `section-${Date.now()}`,
  text: "",
});

export const createNewBlock = (
  title: string = "블록 제목을 입력하세요."
): ContentBlock => ({
  id: `block-${Date.now()}`,
  title: title,
  sections: [createNewSection()],
});

interface Props {
  content: FullAnswer;
  onChange: (newContent: FullAnswer) => void;
  isEditing: boolean;
  onEdit: () => void;
}

export default function AnswerBox({ content, onChange, isEditing, onEdit }: Props) {
  const updateContent = (updater: (draft: FullAnswer) => void) => {
    const newContent = JSON.parse(JSON.stringify(content));
    updater(newContent);
    onChange(newContent);
  };

  const handleFieldChange = (
    field: "header" | "summary" | "footer",
    value: string
  ) => {
    updateContent((draft) => {
      draft[field] = value;
    });
  };

  const addBlock = () =>
    updateContent((draft) => draft.body.push(createNewBlock()));

  const removeBlock = (blockIndex: number) =>
    updateContent((draft) => draft.body.splice(blockIndex, 1));

  const handleBlockTitleChange = (blockIndex: number, value: string) => {
    updateContent((draft) => {
      draft.body[blockIndex].title = value;
    });
  };

  const addSection = (blockIndex: number) =>
    updateContent((draft) =>
      draft.body[blockIndex].sections.push(createNewSection())
    );

  const removeSection = (blockIndex: number, sectionIndex: number) =>
    updateContent((draft) =>
      draft.body[blockIndex].sections.splice(sectionIndex, 1)
    );

  const handleSectionTextChange = (
    blockIndex: number,
    sectionIndex: number,
    value: string
  ) => {
    updateContent((draft) => {
      draft.body[blockIndex].sections[sectionIndex].text = value;
    });
  };

  const handleCopyAnswer = () => {
    const fullText = [
      `1. ${content.header}`,
      `2. ${content.summary}`,
      ...content.body.map((block, blockIndex) => {
        const blockTitle = `${3 + blockIndex}. ${block.title}`;
        const sections = block.sections
          .map((section) => `• ${section.text}`)
          .join("\n");
        return `${blockTitle}\n${sections}`;
      }),
      `${3 + content.body.length}. ${content.footer}`,
    ].join("\n\n");

    navigator.clipboard
      .writeText(fullText)
      .then(() => alert("답변 전체가 클립보드에 복사되었습니다."))
      .catch(() => alert("복사에 실패했습니다."));
  };

  if (!content) {
    return (
      <div className="w-full flex items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 min-h-[384px]">
        답변 내용이 없습니다.
      </div>
    );
  }

  let sectionNumber = 1;

  return (
    <div className="w-full mx-auto p-6 bg-slate-50 border border-slate-200 rounded-lg space-y-4 relative">
      {!isEditing && (
        <div
          onClick={onEdit}
          className="absolute inset-0 z-10 flex items-center justify-center bg-slate-800/40 rounded-2xl cursor-pointer opacity-0 hover:opacity-100 transition-opacity duration-200"
        >
          <span className="text-white text-lg font-semibold">클릭하여 편집</span>
        </div>
      )}

      {/* 1. 인사말 */}
      <div className="flex items-start gap-3">
        <span className="text-lg font-bold text-slate-600 pt-3">
          {sectionNumber++}.
        </span>
        <div className="flex-1">
          <CustomTextarea
            value={content.header}
            onChange={(e) => handleFieldChange("header", e.target.value)}
            disabled={!isEditing}
            placeholder="인사말을 입력하세요."
          />
        </div>
      </div>

      {/* 2. 민원요지 */}
      <div className="flex items-start gap-3">
        <span className="text-lg font-bold text-slate-600 pt-3">
          {sectionNumber++}.
        </span>
        <div className="flex-1">
          <CustomTextarea
            value={content.summary}
            onChange={(e) => handleFieldChange("summary", e.target.value)}
            disabled={!isEditing}
            placeholder="민원 요지를 입력하세요."
          />
        </div>
      </div>

      {/* 3. 답변 본문 블록 */}
      {content.body.map((block, blockIndex) => (
        <div key={block.id || blockIndex} className="flex items-start gap-3">
          <span className="text-lg font-bold text-slate-600 pt-4">
            {sectionNumber + blockIndex}.
          </span>

          <div className="flex-1 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* 블록 헤더 */}
            <div className="flex items-center gap-3 px-4 py-3 border-b bg-gradient-to-r from-gov-950/5 to-gov-700/5">
              <textarea
                className="flex-1 px-3 py-2 text-base font-semibold bg-white/70 rounded-md resize-none outline-none border border-slate-200 focus:border-gov-700/40 focus:ring-2 focus:ring-gov-700/15 disabled:bg-transparent disabled:border-transparent"
                disabled={!isEditing}
                value={block.title}
                onChange={(e) => handleBlockTitleChange(blockIndex, e.target.value)}
                placeholder="블록 제목을 입력하세요."
                rows={1}
              />
              {isEditing && (
                <button
                  onClick={() => removeBlock(blockIndex)}
                  className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
                  title="블록 삭제"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            {/* 섹션 리스트 */}
            <div className="divide-y divide-slate-100">
              {block.sections.map((section, sectionIndex) => (
                <div
                  key={section.id || sectionIndex}
                  className="flex items-start gap-2 px-4 py-3"
                >
                  {/* 🔹 왼쪽 불릿 + +아이콘 */}
                  {isEditing ? (
                    <button
                      onClick={() => addSection(blockIndex)}
                      className="mt-1 p-1 rounded-full text-slate-400 hover:text-gov-800 hover:bg-slate-100 transition"
                      title="항목 추가"
                    >
                      <Plus size={16} />
                    </button>
                  ) : (
                    <span className="mt-2 text-slate-400 select-none">•</span>
                  )}

                  {/* 🔹 오른쪽 삭제 아이콘 */}
                  {isEditing && (
                    <button
                      onClick={() => removeSection(blockIndex, sectionIndex)}
                      className="mt-1 p-1 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                      title="항목 삭제"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}

                  {/* 본문 */}
                  <div className="flex-1">
                    <CustomTextarea
                      value={section.text}
                      onChange={(e) =>
                        handleSectionTextChange(blockIndex, sectionIndex, e.target.value)
                      }
                      disabled={!isEditing}
                      placeholder="내용을 입력하세요."
                    />
                  </div>
                </div>
              ))}

              {block.sections.length === 0 && (
                <div className="px-4 py-6 text-sm text-slate-400">
                  항목이 없습니다. 왼쪽 <span className="font-semibold">+</span> 버튼으로 추가하세요.
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* 하단: 블록 추가 버튼 */}
      {isEditing && (
        <div className="flex items-start gap-3">
          <div className="w-[24px]" />
          <div className="flex-1 flex justify-center">
            <button
              onClick={addBlock}
              className="py-3 px-6 text-base font-semibold text-white bg-gradient-to-r from-gov-950 to-gov-700 rounded-xl shadow hover:brightness-95 transition"
            >
              + 답변 블록 추가
            </button>
          </div>
        </div>
      )}

      {/* 4. 끝맺음 */}
      <div className="flex items-start gap-3">
        <span className="text-lg font-bold text-slate-600 pt-3">
          {sectionNumber + content.body.length}.
        </span>
        <div className="flex-1">
          <CustomTextarea
            value={content.footer}
            onChange={(e) => handleFieldChange("footer", e.target.value)}
            disabled={!isEditing}
            placeholder="마무리 멘트를 입력하세요."
          />
        </div>
      </div>

      {/* 전체 복사 버튼 */}
      {isEditing && (
        <div className="w-full flex justify-end">
          <button
            onClick={handleCopyAnswer}
            className="flex items-center gap-1 text-sm text-slate-600 underline underline-offset-2 hover:text-slate-900"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8l4 4v6a2 2 0 01-2 2h-2M8 16v4a2 2 0 002 2h4a2 2 0 002-2v-4m-8 0h8"
              />
            </svg>
            복사하기
          </button>
        </div>
      )}
    </div>
  );
}

// --- CustomTextarea ---
function CustomTextarea({
  value,
  onChange,
  disabled,
  placeholder,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled: boolean;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      rows={2}
      className="w-full p-4 bg-white rounded-lg border resize-none text-md leading-relaxed disabled:bg-slate-100 disabled:border-slate-200"
    />
  );
}
