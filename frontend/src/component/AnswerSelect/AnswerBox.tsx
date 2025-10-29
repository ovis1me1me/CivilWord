import React from 'react';

// --- Interface 정의 ---

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

// --- Helper 함수 ---

const createNewSection = (): Section => ({
  id: `section-${Date.now()}`,
  text: '',
});

// createNewBlock는 Props 정의에서 참조되므로 여기서 export 해야 할 수 있습니다.
// (만약 다른 파일에서도 이 타입을 쓴다면 types.ts 등으로 분리하는 것이 좋습니다.)
export const createNewBlock = (title: string = '블록 제목을 입력하세요.'): ContentBlock => ({
  id: `block-${Date.now()}`,
  title: title,
  sections: [createNewSection()],
});

// --- Props 정의 ---

interface Props {
  content: FullAnswer;
  onChange: (newContent: FullAnswer) => void;
  isEditing: boolean;
  onEdit: () => void;
}

// --- 컴포넌트 본문 ---

export default function AnswerBox({ content, onChange, isEditing, onEdit }: Props) {
  // --- 핸들러 함수들 ---

  const updateContent = (updater: (draft: FullAnswer) => void) => {
    // 불변성을 유지하며 content 객체를 업데이트합니다.
    const newContent = JSON.parse(JSON.stringify(content));
    updater(newContent);
    onChange(newContent);
  };

  const handleFieldChange = (
    field: 'header' | 'summary' | 'footer',
    value: string
  ) => {
    updateContent(draft => {
      draft[field] = value;
    });
  };

  const addBlock = () =>
    updateContent(draft => draft.body.push(createNewBlock()));

  const removeBlock = (blockIndex: number) =>
    updateContent(draft => draft.body.splice(blockIndex, 1));

  const handleBlockTitleChange = (blockIndex: number, value: string) => {
    updateContent(draft => {
      draft.body[blockIndex].title = value;
    });
  };

  const addSection = (blockIndex: number) =>
    updateContent(draft =>
      draft.body[blockIndex].sections.push(createNewSection())
    );

  const removeSection = (blockIndex: number, sectionIndex: number) =>
    updateContent(draft =>
      draft.body[blockIndex].sections.splice(sectionIndex, 1)
    );

  const handleSectionTextChange = (
    blockIndex: number,
    sectionIndex: number,
    value: string
  ) => {
    updateContent(draft => {
      draft.body[blockIndex].sections[sectionIndex].text = value;
    });
  };

  const handleCopyAnswer = () => {
    // 텍스트를 클립보드에 복사하기 좋은 형식으로 변환합니다.
    const fullText = [
      `1. ${content.header}`,
      `2. ${content.summary}`,
      ...content.body.map((block, blockIndex) => {
        const blockTitle = `${3 + blockIndex}. ${block.title}`;
        const sections = block.sections
          .map(section => `• ${section.text}`)
          .join('\n');
        return `${blockTitle}\n${sections}`;
      }),
      `${3 + content.body.length}. ${content.footer}`,
    ].join('\n\n');

    navigator.clipboard
      .writeText(fullText)
      .then(() => alert('답변 전체가 클립보드에 복사되었습니다.'))
      .catch(() => alert('복사에 실패했습니다.'));
  };

  // --- 렌더링 로직 ---

  if (!content) {
    return (
      <div className="w-full flex items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 min-h-[384px]">
        답변 내용이 없습니다.
      </div>
    );
  }

  let sectionNumber = 1;

  return (
    <div className="w-full mx-auto p-6 bg-slate-50 border border-slate-200 rounded-lg space-y-3 relative">
      {!isEditing && (
        <div
          onClick={onEdit}
          className="absolute inset-0 z-10 flex items-center justify-center bg-slate-800/40 rounded-2xl cursor-pointer opacity-0 hover:opacity-100 transition-opacity duration-200"
        >
          <span className="text-white text-lg font-semibold">클릭하여 편집</span>
        </div>
      )}

      {/* 1. 인사말 */}
      <div className="flex items-start space-x-3">
        <span className="text-lg font-bold text-slate-600 pt-3">
          {sectionNumber++}.
        </span>
        <div className="flex-1">
          <CustomTextarea
            value={content.header}
            onChange={e => handleFieldChange('header', e.target.value)}
            disabled={!isEditing}
            placeholder="인사말을 입력하세요."
          />
        </div>
      </div>

      {/* 2. 민원요지 */}
      <div className="flex items-start space-x-3">
        <span className="text-lg font-bold text-slate-600 pt-3">
          {sectionNumber++}.
        </span>
        <div className="flex-1">
          <CustomTextarea
            value={content.summary}
            onChange={e => handleFieldChange('summary', e.target.value)}
            disabled={!isEditing}
            placeholder="민원 요지를 입력하세요."
          />
        </div>
      </div>

      {/* 3. 답변 본문 블록 */}
      {content.body.map((block, blockIndex) => (
        <div key={block.id || blockIndex} className="flex items-start space-x-3">
          <span className="text-lg font-bold text-slate-600 pt-4">
            {sectionNumber + blockIndex}.
          </span>
          <div className="flex-1 p-4 bg-white rounded-xl border-l-4 border-slate-400 shadow space-y-3">
            <div className="flex items-center gap-2">
              <textarea
                className="flex-1 p-2 text-base font-semibold bg-slate-50 rounded-md resize-none disabled:bg-transparent disabled:p-0"
                disabled={!isEditing}
                value={block.title}
                onChange={e => handleBlockTitleChange(blockIndex, e.target.value)}
                placeholder="블록 제목을 입력하세요."
                rows={1}
              />
              {isEditing && (
                <button
                  onClick={() => removeBlock(blockIndex)}
                  className="w-1/5 p-2 bg-slate-800 text-md text-white font-semibold hover:text-red-500 hover:bg-slate-900 rounded-lg transition"
                >
                  블록 삭제
                </button>
              )}
            </div>

            <div className="pl-4 space-y-3">
              {block.sections.map((section, sectionIndex) => (
                <div
                  key={section.id || sectionIndex}
                  className="flex items-start gap-3"
                >
                  <span className="pt-2 font-semibold text-slate-700 whitespace-nowrap">
                    •
                  </span>
                  <CustomTextarea
                    value={section.text}
                    onChange={e =>
                      handleSectionTextChange(
                        blockIndex,
                        sectionIndex,
                        e.target.value
                      )
                    }
                    disabled={!isEditing}
                    placeholder="내용을 입력하세요."
                  />
                  {isEditing && (
                    <button
                      onClick={() => removeSection(blockIndex, sectionIndex)}
                      className="w-20 mt-6 pb-1 bg-slate-800 text-2xl font-bold text-slate-400 hover:text-red-500 rounded-lg"
                    >
                      –
                    </button>
                  )}
                </div>
              ))}
              {isEditing && (
                <button
                  onClick={() => addSection(blockIndex)}
                  className="ml-1 text-md text-slate-600 hover:text-slate-800"
                >
                  + 항목 추가
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {isEditing && (
        <div className="flex items-start space-x-3">
          <div className="w-[24px]" />
          <div className="flex-1 flex justify-center">
            <button
              onClick={addBlock}
              className="py-3 px-6 text-base font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition"
            >
              + 답변 검토 블록 추가
            </button>
          </div>
        </div>
      )}

      {/* 4. 끝맺음 */}
      <div className="flex items-start space-x-3">
        <span className="text-lg font-bold text-slate-600 pt-3">
          {sectionNumber + content.body.length}.
        </span>
        <div className="flex-1">
          <CustomTextarea
            value={content.footer}
            onChange={e => handleFieldChange('footer', e.target.value)}
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

// --- CustomTextarea 컴포넌트 ---
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