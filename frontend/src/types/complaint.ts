// 민원 데이터 타입 정의
export interface Complaint {
  id: number;
  user_uid: string;
  title: string;
  content: string;
  is_public: boolean;
  created_at: string; // ✅ 날짜
  summary: string;
  reply_summary: string;
  reply_status: string; // ✅ 답변 상태
}

// export interface ComplaintDetail {
//   id: number;
//   title: string;
//   content: string;      // 민원 상세 내용
//   summary: string;      // 민원 요지 (LLM 정리본)
//   answerSummary: string; // 답변 요지 (사용자 입력)
// }

/**
 * ✅ 상세 화면용 타입 분리
 * - longSummary: 민원요지(긴 텍스트) — 표시용
 * - shortSummary: 답변요지 타이틀(짧은 요약) — 편집 가능
 * - answerBlocks: 사용자가 저장한 답변요지 블록들(있을 때만)
 */
export interface ComplaintDetail {
  id: number;
  title: string;
  content: string;

  // 기존 필드
  summary: string;        // (기존) 민원 요지
  answerSummary: string;  // (기존) 답변 요지

  // 새 필드 (백엔드 확장 대응)
  longSummary?: string;   // 긴 요약 (민원 요지 표시용)
  shortSummary?: string;  // 짧은 요약 (답변 요지 타이틀)
  answerBlocks?: {
    summaryTitle: string;
    answerOptions: string[];
  }[];
}
