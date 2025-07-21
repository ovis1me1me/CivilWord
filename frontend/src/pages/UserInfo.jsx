import React, { useState } from 'react';
import './UserInfo.css';
import { useNavigate } from 'react-router-dom';
import { fetchUserInfo } from '../utils/api';

function UserInfo() {
  const navigate = useNavigate(); // 훅 사용

  const handleStart = () => {
    // `/upload_excel` 페이지로 이동
    navigate('/upload_excel');
  };

  const [form, setForm] = useState({
    name: '',
    department: '',
    contact: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('입력된 정보:', form);
    // 이후 단계(페이지 이동 등) 연결 가능
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
          value={form.phone}
          onChange={handleChange}
        />

        {/* <label>민원 카테고리</label> 
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
        >
          <option value="">-- 선택 --</option>
          <option value="불법주정차">불법주정차</option>
          <option value="소음민원">소음민원</option>
          <option value="불편신고">불편신고</option>
        </select>*/}

        <button className="start-button" onClick={handleStart}>
          수정하기
        </button>
      </form>
    </div>
  );
}

export default UserInfo;
