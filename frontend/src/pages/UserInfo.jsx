import React, { useEffect, useState } from 'react';
import './UserInfo.css';
import { useNavigate } from 'react-router-dom';
import { fetchUserInfo, updateUserInfo } from '../utils/api'; // updateUserInfo도 미리 임포트

function UserInfo() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    department: '',
    contact: '',
    email: '',
  });

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
      navigate('/upload_excel');
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
        <select
          name="department"
          value={form.department}
          onChange={handleChange}
        >
          <option value="">-- 선택 --</option>
          <option value="교통행정과">교통행정과</option>
          <option value="복지정책과">복지정책과</option>
          <option value="환경관리과">환경관리과</option>
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
