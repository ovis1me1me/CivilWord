import axios, { InternalAxiosRequestConfig } from "axios";

/** ✅ Axios 인스턴스 생성 */
const instance = axios.create({
  baseURL: 'http://127.0.0.1:8000/', // 👉 실제 백엔드 주소로 맞춰줘!
  withCredentials: true, // 👉 세션 쿠키 인증 필요시 true
  headers: {
    'Content-Type': 'application/json',
  },
});

/** ✅ JWT 토큰 자동 추가 인터셉터 */
instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
},
  (error) => {
    return Promise.reject(error);
  });

/** ✅ 로그인 */
export const loginUser = (username: string, password: string) =>
  instance.post(
    '/login',
    new URLSearchParams({ username, password }),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }
  );

/** ✅ 현재 로그인된 사용자 정보 조회 */
export const fetchUserInfo = () => instance.get('/user-info');

/** ✅ 사용자 정보 수정 */
export const updateUserInfo = async (data) => {
  const response = await instance.put('/user-info', data);
  return response.data;
};

/** ✅ 1️. 엑셀로 민원 업로드 */
export const uploadExcelFile = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return instance.post('/complaints/upload-excel', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

/** ✅ 2️. 민원 목록 조회 */
export const fetchComplaints = (params: { sort?: string; limit?: number; skip?: number }) =>
  instance.get('/complaints', { params });

/** ✅ 3️. 선택 민원 삭제 */
export const deleteComplaint = (id: number) =>
  instance.delete(`/complaints/${id}`);

/** ✅ 4️. 선택 민원 엑셀 다운로드 */
export const downloadSelectedComplaints = (ids: number[]) =>
  instance.get('/complaints/download-excel', {
    params: { ids: ids.join(',') },
    responseType: 'blob', // 👉 파일 다운로드는 blob
  });

/** ✅ 민원 상세 조회 ------------------------------------------------------- 7/21 추가 */
export const fetchComplaintDetail = (id: number) =>
  instance.get(`/complaints/${id}`);

/** ✅ 5️. 민원 답변 생성 */
export const generateReply = (id: number, answerSummary: object) =>
  instance.post(`/complaints/${id}/generate-reply`, { answerSummary });

/** ✅ 6️. 민원 답변 재생성 */
export const regenerateReply = (id: number) =>
  instance.post(`/complaints/${id}/generate-reply-again`);

/** ✅ 7️. 생성된 답변 조회 (답변 3가지) */
export const fetchReplies = (id: number) =>
  instance.get(`/complaints/${id}/replies`);

/** ✅ 8️. 민원 요약 조회 */
export const fetchComplaintSummary = (id: number) =>
  instance.get(`/complaints/${id}/summary`);

/** ✅ 9️. 답변 요지 조회 */
export const fetchReplySummary = (id: number) =>
  instance.get(`/complaints/${id}/reply-summary`);

/** ✅ 10️. 답변 요지 저장 */
export const saveReplySummary = (id: number, payload: {
  //complaint_summary: string;
  answer_summary: {
    index: string;
    section: { title: string; text: string }[];
  }[];
}) => {
  return instance.post(`/complaints/${id}/reply-summary`, payload);
};

// /** ✅ 11️. 답변 요지 수정 */
// export const updateReplySummary = (id: number, summary: string) =>
//   instance.put(`/complaints/${id}/reply-summary`, { summary });

/** ✅ 11-대체. 최종 답변 내용 수정 */
export const updateReplyContent = (complaint_id: number, content: object) =>
  instance.put(`/complaints/${complaint_id}/reply`, content);

/** ✅ 12️. 유사 답변 추천 */
export const fetchSimilarReplies = (id: number) =>
  instance.get(`/complaints/${id}/similar-replies`);

/** ✅ 13️. 민원 답변 상태 변경 */
export const updateReplyStatus = (
  id: number,
  status: '답변전' | '수정중' | '답변완료'
) => instance.put(`/complaints/${id}/reply-status`, { status });

/** ✅ 14. 선택한 민원을 히스토리로 이동 */
export const moveToHistory = (ids: number[]) =>
  instance.post('/complaints/move-to-history', null, {  // ✅ body 없이
    params: { ids: ids.join(',') },
  });

/** ✅ 15. 히스토리 목록 조회 */
export const getHistory = (token: string) =>
  instance.get('/complaints/history', {
    headers: { Authorization: `Bearer ${token}` },
  });

/** ✅ 16. 민원 히스토리 제목 검색 */
export const searchHistory = (token: string, keyword: string) =>
  instance.get(`/complaints/history/search?keyword=${encodeURIComponent(keyword)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

/** ✅ 17. 관리자용 전체 답변 조회 */ 
export const fetchAllRepliesAdmin = () =>
  instance.get('/admin/replies');

// ✅ 18. 히스토리 상세 조회
export const fetchHistoryDetail = (id: number) =>
  instance.get(`/complaints/history/${id}`);

/** ✅ 19. 유사 민원 히스토리 조회 */ // ✅ 새로 추가된 부분
export const fetchSimilarHistories = async (id: number) => {
  const response = await instance.get(`/complaints/${id}/history-similar`);
  return response.data;
};

export const createComplaint = (payload: {
  title: string;
  content: string;
  is_public: boolean;
}) => instance.post('/complaints', payload);


/** ✅ 기본 axios 인스턴스 export */
export default instance;