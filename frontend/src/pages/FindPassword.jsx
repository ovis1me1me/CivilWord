import React, { useState } from "react";
import axios from "axios";
import "./FindPassword.css";

function FindPassword({ onQuestionFound }) {
  const [userId, setUserId] = useState("");
  const [question, setQuestion] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    try {
      const res = await axios.post('http://localhost:8000/find-password/question', { user_id: userId });
      setQuestion(res.data.question);
      onQuestionFound(userId, res.data.question);
    } catch (err) {
      setError("존재하지 않는 사용자입니다.");
    }
  };

  return (
    <div className="password-container">
      <h2 className="password-title"><a href="/Login">Civil Word</a></h2>
      <input
        type="text"
        placeholder="아이디"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
      />
      <button onClick={handleSubmit}>비밀번호 찾기</button>
      {error && <p className="password-error">{error}</p>}
    </div>
  );
}

export default FindPassword;
