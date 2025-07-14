import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Register.css';

function Register() {
  const navigate = useNavigate();

  const [user, setUser] = useState({
    user_id: '',
    name: '',
    password: '',
    question: '',
    answer: '',
  });

  const [userInfo, setUserInfo] = useState({
    name: '',
    department: '',
    contact: '',
    email: '',
  });

  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleInfoChange = (e) => {
    const { name, value } = e.target;
    setUserInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requestData = {
      user: user,
      user_info: userInfo,
    };

    try {
      const response = await axios.post('http://localhost:8000/register', requestData);
      alert('회원가입이 완료되었습니다.');
      navigate('/login');
    } catch (error) {
      if (error.response) {
        alert(`❌ 회원가입 실패: ${error.response.data.detail}`);
        console.error('서버 응답 오류:', error.response.data);
      } else {
        alert('❌ 서버에 연결할 수 없습니다.');
        console.error('연결 오류:', error.message);
      }
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <h2 className="register-title">Civil Word</h2>
        <form onSubmit={handleSubmit} className="register-form">
          <input type="text" name="user_id" placeholder="아이디" value={user.user_id} onChange={handleUserChange} />
          <input type="password" name="password" placeholder="비밀번호" value={user.password} onChange={handleUserChange} />

          <select name="question" value={user.question} onChange={handleUserChange}>
            <option value="">비밀번호 찾기 질문</option>
            <option value="당신이 키운 첫 반려동물 이름은?">당신이 키운 첫 반려동물 이름은?</option>
            <option value="졸업한 초등학교 이름은?">졸업한 초등학교 이름은?</option>
            <option value="당신이 태어난 도시는?">당신이 태어난 도시는?</option>
          </select>

          <input type="text" name="answer" placeholder="비밀번호 찾기 답변" value={user.answer} onChange={handleUserChange} />
          <input type="text" name="name" placeholder="이름" value={userInfo.name} onChange={handleInfoChange} />

          <select name="department" value={userInfo.department} onChange={handleInfoChange}>
            <option value="">담당부서</option>
            <option value="교통행정과">교통행정과</option>
            <option value="복지정책과">복지정책과</option>
            <option value="환경관리과">환경관리과</option>
          </select>

          <input type="text" name="contact" placeholder="부서 연락처 ex) 051-220-4000" value={userInfo.contact} onChange={handleInfoChange} />
          <input type="email" name="email" placeholder="이메일" value={userInfo.email} onChange={handleInfoChange} />
          
          <button type="submit" className="register-button">회원가입</button>
        </form>
      </div>
    </div>
  );
}

export default Register;
