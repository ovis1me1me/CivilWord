
export const getDummyGeneratedAnswers = () => [
  '답변 1: 도로 복구 요청 접수됨.',
  '답변 2: 해당 부서로 전달 예정.',
  '답변 3: 안전 점검 후 조치 예정.',
];

export const getDummySimilarAnswer = () =>
  '유사 민원 답변: 최근에 처리된 도로 파손 사례와 유사합니다.';

export const getDummyComplaint = () => ({
  id: 1,
  title: '도로 파손 관련 민원',
  content: '도로가 파손되어 차량 통행에 지장이 있어 민원을 제기합니다.',
  summary: '도로 파손으로 인해 차량 통행 불편이 발생했습니다.',
  answerSummary: '',
});
