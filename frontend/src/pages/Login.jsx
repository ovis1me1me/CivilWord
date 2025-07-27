import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../utils/api'; // 경로는 프로젝트 구조에 맞게
import './Login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
  e.preventDefault();

  try {
    const response = await loginUser(username, password);
    const { access_token } = response.data;

    localStorage.setItem('token', access_token);
    navigate('/upload_excel'); // 성공 시 이동
  } catch (error) {
    console.error(error);
    setErrorMsg('아이디 또는 비밀번호가 올바르지 않습니다.');
  }
};

  return (
    <div className="login-page-wrapper">
      <div className="login-container">
        <form onSubmit={handleLogin} className="login-form">
          <h2 className="login-title">Civil Word</h2>
          <input
            type="text"
            placeholder="아이디"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="login-input"
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
          />
          <button type="submit" className="login-button">
            로그인
          </button>
          {errorMsg && <p className="login-error">{errorMsg}</p>}
          <div className="login-links">
            <a href="/FindId">아이디 찾기</a>
            <span>|</span>
            <a href="/FindPassword">비밀번호 찾기</a>
            <span>|</span>
            <a href="/Register">회원가입</a>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
