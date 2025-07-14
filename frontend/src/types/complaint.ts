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

export interface ComplaintDetail {
  id: number;
  title: string;
  content: string;      // 민원 상세 내용
  summary: string;      // 민원 요지 (LLM 정리본)
  answerSummary: string; // 답변 요지 (사용자 입력)
}