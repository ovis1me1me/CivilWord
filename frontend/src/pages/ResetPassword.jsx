import React, { useState } from "react";
import axios from "axios";
import "./FindPassword.css";

function ResetPassword({ userId, question }) {
  const [answer, setAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleReset = async () => {
    try {
      const res = await axios.post('http://localhost:8000/change-password', {
        user_id: userId,
        answer,
        new_password: newPassword
      });
      setMessage(res.data.message);
      setError("");
    } catch (err) {
      if (err.response.status === 403) {
        setError("답변이 일치하지 않습니다.");
      } else {
        setError("비밀번호 변경에 실패했습니다.");
      }
    }
  };

  return (
    <div className="password-container">
      <h2 className="password-title">Civil Word</h2>
      <p className="password-question">{question}</p>
      <input
        type="text"
        placeholder="질문에 대한 답변"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
      />
      {error && <p className="password-error">{error}</p>}
      <input
        type="password"
        placeholder="새 비밀번호 입력"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      {message && <p className="password-success">{message}</p>}
      <button onClick={handleReset}>비밀번호 재설정</button>
      <button onClick={() => (window.location.href = '/Login')}>로그인 하러가기</button>
    </div>
  );
}

export default ResetPassword;
