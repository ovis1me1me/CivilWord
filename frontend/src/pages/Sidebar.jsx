import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Sidebar.css';
import {
  edit,
  name as nameIcon,
  department,
  contact,
  email,
  list,
  history,
  logout,
} from '../assets/icons';
import { fetchUserInfo } from '../utils/api'; // ✅ API 함수 import

const Sidebar = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({
    name: '',
    department: '',
    contact: '',
    email: '',
  });

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const response = await fetchUserInfo();
        setUserInfo(response.data);
      } catch (error) {
        console.error('사용자 정보를 불러오는 데 실패했습니다.', error);
        // 로그인 만료 등의 예외 처리도 고려 가능
      }
    };
    loadUserInfo();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-title">Civil Word</div>

      <div className="sidebar-section">
        <div className="sidebar-label-with-edit">
          <p className="sidebar-label">프로필</p>
          <img src={edit} alt="수정 아이콘" className="edit-icon" onClick={() => navigate('/userinfo')} />
        </div>
        <ul>
          <li><img src={nameIcon} alt="이름 아이콘" /> {userInfo.name}</li>
          <li><img src={department} alt="부서 아이콘" /> {userInfo.department}</li>
          <li><img src={contact} alt="연락처 아이콘" /> {userInfo.contact}</li>
          <li><img src={email} alt="이메일 아이콘" /> {userInfo.email}</li>
        </ul>
      </div>

      <div className="sidebar-section">
        <p className="sidebar-label">저장소</p>
        <ul>
          <li>
            <Link to="/complaints">
              <img src={list} alt="민원 목록 아이콘" /> 민원 목록
            </Link>
          </li>
          <li>
            <Link to="/history">
              <img src={history} alt="히스토리 아이콘" /> 히스토리
            </Link>
          </li>
        </ul>
      </div>

      <div className="sidebar-footer">
        <button onClick={handleLogout}>
          <img src={logout} alt="로그아웃 아이콘" /> 로그아웃
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
