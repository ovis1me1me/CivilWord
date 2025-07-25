import { v4 as uuidv4 } from 'uuid';

// '가, 나, 다...' 항목 하나
export interface AnswerSection {
  id: string;
  text: string;
}

// 'A민원에 대한 검토 결과...' 블록 하나
export interface ContentBlock {
  id: string;
  title: string;
  sections: AnswerSection[];
}

// 하나의 완전한 답변 템플릿 전체
export interface FullAnswer {
  header: string;
  summary: string;
  body: ContentBlock[];
  footer: string;
}

// --- 👇 [추가] 헬퍼 함수들 ---
export const createNewSection = (text = ''): AnswerSection => ({
  id: uuidv4(),
  text,
});

export const createNewBlock = (title = ''): ContentBlock => ({
  id: uuidv4(),
  title: title || '새로운 민원에 대한 검토 결과는 다음과 같습니다.',
  sections: [createNewSection()],
});