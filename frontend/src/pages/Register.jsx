import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Register.css';

function Register() {
  const navigate = useNavigate();

  const [user, setUser] = useState({
    user_id: '',
    name: '', // Note: This 'name' field in 'user' state seems redundant given 'userInfo.name'. You might want to remove one if they serve the same purpose.
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

    // --- Validation Logic Starts Here ---
    const allFields = { ...user, ...userInfo }; // Combine all fields for easier iteration

    for (const key in allFields) {
      // Exclude the 'name' field from 'user' if it's redundant.
      // If 'user.name' is indeed meant for something else, adjust this condition.
      if (key === 'name' && allFields[key] === user.name && userInfo.name !== '') {
         // If user.name is empty but userInfo.name is filled, skip this validation for user.name
         if (user.name === '' && userInfo.name !== '') {
            continue;
         }
      }

      if (allFields[key] === '') {
        let fieldName = '';
        switch (key) {
          case 'user_id':
            fieldName = '아이디';
            break;
          case 'password':
            fieldName = '비밀번호';
            break;
          case 'question':
            fieldName = '비밀번호 찾기 질문';
            break;
          case 'answer':
            fieldName = '비밀번호 찾기 답변';
            break;
          case 'name':
            fieldName = '이름';
            break;
          case 'department':
            fieldName = '담당부서';
            break;
          case 'contact':
            fieldName = '부서 연락처';
            break;
          case 'email':
            fieldName = '이메일';
            break;
          default:
            fieldName = key;
        }
        alert(`${fieldName}을(를) 입력해주세요.`);
        return; // Stop the submission if any field is empty
      }
    }
    // --- Validation Logic Ends Here ---

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
        <h2 className="register-title"><a href="/Login">Civil Word</a></h2>
        <form onSubmit={handleSubmit} className="register-form">
          <input type="text" name="user_id" placeholder="아이디" value={user.user_id} onChange={handleUserChange} />
          <input type="password" name="password" placeholder="비밀번호" value={user.password} onChange={handleUserChange} />

          <select name="question" value={user.question} onChange={handleUserChange}>
            <option value="">비밀번호 찾기 질문 선택</option>
            <option value="내가 키운 첫 반려동물 이름은?">내가 키운 첫 반려동물 이름은?</option>
            <option value="내가 졸업한 초등학교 이름은?">내가 졸업한 초등학교 이름은?</option>
            <option value="내가 태어난 도시는?">내가 태어난 도시는?</option>
            <option value="나의 첫사랑 이름은?">나의 첫사랑 이름은?</option>
            <option value="나의 어머니 성함은?">나의 어머니 성함은?</option>
            <option value="나의 아버지 성함은?">나의 아버지 성함은?</option>
            <option value="기억에 남는 선생님 성함은?">기억에 남는 선생님 성함은?</option>
          </select>

          <input type="text" name="answer" placeholder="비밀번호 찾기 답변" value={user.answer} onChange={handleUserChange} />
          <input type="text" name="name" placeholder="이름" value={userInfo.name} onChange={handleInfoChange} />

          <select name="department" value={userInfo.department} onChange={handleInfoChange}>
            <option value="">담당부서 선택</option>
            {departmentOptions.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
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