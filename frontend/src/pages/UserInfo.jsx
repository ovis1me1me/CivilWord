import React, { useEffect, useState } from 'react';
import './UserInfo.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchUserInfo, updateUserInfo } from '../utils/api'; // updateUserInfo도 미리 임포트

function UserInfo() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/upload_excel';

  const [form, setForm] = useState({
    name: '',
    department: '',
    contact: '',
    email: '',
  });

  const departmentOptions = [
    '구청장실', '부구청장실', '국장실', '기획실', '소통감사실', '총무과', '체육홍보과',
    '재무과', '세무1과', '세무2과', '세무3과', '민원여권과', '경제진흥과', '일자리정책과',
    '전략사업과', '해양수산과', '토지정보과', '교통행정과', '주차관리과', '자원순환과',
    '환경위생과', '산림녹지과', '문화예술과', '관광진흥과', '평생교육과', '복지정책과',
    '생활보장과', '노인장애인복지과', '가족행복과', '아동청소년과', '안전총괄과',
    '도시재생과', '건설과', '도시정비과', '건축과', '주거정비과', '보건행정과',
    '건강증진과', '을숙도문화회관', '도서관', '시설관리사업소', '의회사무국',
    '괴정1동', '괴정2동', '괴정3동', '괴정4동', '당리동', '하단1동', '하단2동',
    '신평1동', '신평2동', '장림1동', '장림2동', '다대1동', '다대2동', '구평동',
    '감천1동', '감천2동'
  ];

  // 1. 컴포넌트가 처음 렌더링 될 때 유저 정보 불러오기
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const response = await fetchUserInfo();
        setForm({
          name: response.data.name || '',
          department: response.data.department || '',
          contact: response.data.contact || '',
          email: response.data.email || '',
        });
      } catch (error) {
        console.error('사용자 정보를 불러오는 데 실패했습니다.', error);
      }
    };
    loadUserInfo();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateUserInfo(form);
      alert('유저 정보가 성공적으로 수정되었습니다!');
      navigate(from); // 이전 경로로 이동
    } catch (error) {
      console.error('유저 정보 수정 실패:', error);
      alert('정보 수정에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div className="form-container">
      <h1 className="title">Civil Word</h1>
      <form onSubmit={handleSubmit} className="form-box">
        <label>담당자 이름</label>
        <input
          type="text"
          name="name"
          placeholder="이름"
          value={form.name}
          onChange={handleChange}
        />

        <label>담당부서</label>
        <select name="department" value={form.department} onChange={handleChange}>
            <option value="">담당부서 선택</option>
            {departmentOptions.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

        <label>부서 연락처</label>
        <input
          type="text"
          name="contact"
          placeholder="051-220-4000"
          value={form.contact}
          onChange={handleChange}
        />

        <label>이메일</label>
        <input
          type="email"
          name="email"
          placeholder="example@domain.com"
          value={form.email}
          onChange={handleChange}
        />

        <button className="start-button" type="submit">
          수정하기
        </button>
      </form>
    </div>
  );
}

export default UserInfo;
