import React from 'react';

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

// --- 새로운 블록/섹션 생성을 위한 헬퍼 함수 ---
const createNewSection = (): Section => ({
  id: `section-${Date.now()}`,
  text: '',
});

const createNewBlock = (): ContentBlock => ({
  id: `block-${Date.now()}`,
  title: '새로운 검토 항목',
  sections: [createNewSection()],
});

// --- 컴포넌트 Props 정의 ---
interface Props {
  content: FullAnswer;
  onChange: (newContent: FullAnswer) => void;
  isEditing: boolean;
  onEdit: () => void;
}

export default function AnswerBox({ content, onChange, isEditing, onEdit }: Props) {
  // --- 데이터 수정 관련 핸들러 함수들 ---
  const updateContent = (updater: (draft: FullAnswer) => void) => {
    const newContent = JSON.parse(JSON.stringify(content));
    updater(newContent);
    onChange(newContent);
  };

  const handleFieldChange = (field: 'header' | 'summary' | 'footer', value: string) => {
    updateContent(draft => { draft[field] = value; });
  };

  const addBlock = () => updateContent(draft => { draft.body.push(createNewBlock()); });
  
  const removeBlock = (blockIndex: number) => updateContent(draft => { draft.body.splice(blockIndex, 1); });

  const handleBlockTitleChange = (blockIndex: number, value: string) => {
    updateContent(draft => { draft.body[blockIndex].title = value; });
  };

  const addSection = (blockIndex: number) => updateContent(draft => { draft.body[blockIndex].sections.push(createNewSection()); });
  
  const removeSection = (blockIndex: number, sectionIndex: number) => updateContent(draft => { draft.body[blockIndex].sections.splice(sectionIndex, 1); });
  
  const handleSectionTextChange = (blockIndex: number, sectionIndex: number, value: string) => {
    updateContent(draft => { draft.body[blockIndex].sections[sectionIndex].text = value; });
  };

  // '가', '나', '다' 와 같은 라벨을 생성하는 함수
  const getSectionLabel = (index: number) => `${'가나다라마바사아자차카타파하'[index]}.`;

  if (!content) {
    return <div className="p-4 bg-gray-100 rounded-2xl">답변 내용이 없습니다.</div>;
  }

  // 섹션 번호를 관리하기 위한 변수
  let sectionNumber = 1;

  return (
    <div className="relative w-full max-w-4xl mx-auto p-6 bg-gray-100 rounded-2xl space-y-6">
      {!isEditing && (
        <div
          onClick={onEdit}
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 rounded-2xl cursor-pointer opacity-0 hover:opacity-100 transition-opacity duration-200"
        >
          <span className="text-white text-lg font-semibold">클릭하여 편집</span>
        </div>
      )}

      {/* 1. 인사말 */}
      <div className="flex items-start space-x-3">
        <span className="text-lg font-bold text-gray-800 pt-3">{sectionNumber++}.</span>
        <div className="flex-1">
          <SectionCard>
            <CustomTextarea
              value={content.header}
              onChange={e => handleFieldChange('header', e.target.value)}
              disabled={!isEditing}
              placeholder="인사말을 입력하세요."
            />
          </SectionCard>
        </div>
      </div>

      {/* 2. 민원요지 */}
      <div className="flex items-start space-x-3">
        <span className="text-lg font-bold text-gray-800 pt-3">{sectionNumber++}.</span>
        <div className="flex-1">
          <SectionCard>
            <CustomTextarea
              value={content.summary}
              onChange={e => handleFieldChange('summary', e.target.value)}
              disabled={!isEditing}
              placeholder="민원 요지를 입력하세요."
            />
          </SectionCard>
        </div>
      </div>
      
      {/* 3. 답변 본문 블록 (body) */}
      {content.body.map((block, blockIndex) => (
        <div key={block.id || blockIndex} className="flex items-start space-x-3">
          <span className="text-lg font-bold text-gray-800 pt-4">{sectionNumber + blockIndex}.</span>
          <div className="flex-1 p-4 bg-white rounded-xl border-l-4 border-blue-500 shadow space-y-3">
            <div className="flex items-center gap-2">
              <textarea
                className="flex-1 p-2 text-base font-semibold bg-gray-50 rounded-md resize-none disabled:bg-transparent disabled:p-0"
                disabled={!isEditing}
                value={block.title}
                onChange={e => handleBlockTitleChange(blockIndex, e.target.value)}
                placeholder="블록 제목을 입력하세요."
                rows={1}
              />
              {isEditing && (
                <button onClick={() => removeBlock(blockIndex)} className="w-1/5 text-sm text-red-500 hover:text-red-700">
                  블록 삭제
                </button>
              )}
            </div>

            <div className="pl-4 space-y-3">
              {block.sections.map((section, sectionIndex) => (
                <div key={section.id || sectionIndex} className="flex items-start gap-3">
                  <span className="pt-2 font-semibold text-gray-700 whitespace-nowrap">
                    {getSectionLabel(sectionIndex)}
                  </span>
                  <CustomTextarea
                    value={section.text}
                    onChange={e => handleSectionTextChange(blockIndex, sectionIndex, e.target.value)}
                    disabled={!isEditing}
                    placeholder="내용을 입력하세요."
                  />
                  {isEditing && (
                    <button onClick={() => removeSection(blockIndex, sectionIndex)} className="w-1/5 text-xl text-gray-400 hover:text-red-500">
                      –
                    </button>
                  )}
                </div>
              ))}
              {isEditing && (
                <button onClick={() => addSection(blockIndex)} className="ml-1 text-sm text-blue-600 hover:text-blue-800">
                  + 항목 추가
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {isEditing && (
        <button
          onClick={addBlock}
          className="w-full py-3 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
        >
          + 답변 검토 블록 추가
        </button>
      )}
      
      {/* 4. 끝맺음 (footer) */}
      <div className="flex items-start space-x-3">
        <span className="text-lg font-bold text-gray-800 pt-3">{sectionNumber + content.body.length}.</span>
        <div className="flex-1">
          <SectionCard>
            <CustomTextarea
              value={content.footer}
              onChange={e => handleFieldChange('footer', e.target.value)}
              disabled={!isEditing}
              placeholder="마무리 멘트를 입력하세요."
            />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

// --- 하위 컴포넌트들 ---
function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-4 bg-white rounded-xl shadow">{children}</div>
  );
}

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
      className="w-full p-3 border rounded-md resize-none text-sm leading-relaxed disabled:bg-gray-50 disabled:border-gray-200"
    />
  );
}
