import React, { useState } from 'react';
import axios from 'axios';
import './FindId.css';

const FindId = () => {
  const [formData, setFormData] = useState({ name: '', contact: '', email: '' });
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUserId('');
    setError('');

    try {
      const response = await axios.post('http://localhost:8000/find-user-id', formData);
      setUserId(response.data.user_id);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);  // <- 백엔드에서 보낸 상세 에러 메시지 출력
      } else {
        setError('오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  };

  return (
    <div className="find-id-container">
      <h2 className="find-id-title">Civil Word</h2>

      {userId ? (
        <div className="find-id-result">
          <p>당신의 <strong>아이디</strong>는 <strong>"{userId}"</strong> 입니다.</p>
          <button onClick={() => (window.location.href = '/Login')}>로그인 하러가기</button>
          <button onClick={() => (window.location.href = '/FindPassword')}>비밀번호 찾기</button>
        </div>
      ) : (
        <form className="find-id-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="이름"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="contact"
            placeholder="부서 연락처 예) 051-220-4000"
            value={formData.contact}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="이메일"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <button type="submit">아이디 찾기</button>
          {error && <p className="error-message">{error}</p>}
        </form>
      )}
    </div>
  );
};

export default FindId;
