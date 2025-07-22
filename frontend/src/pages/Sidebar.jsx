import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // ✅ useLocation 추가
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
import { fetchUserInfo } from '../utils/api';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation(); // ✅ 현재 라우트 감지
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
      }
    };
    loadUserInfo();
  }, [location.pathname]); // ✅ 경로 변경 시마다 다시 유저 정보 fetch

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-title"><a href="/upload_excel">Civil Word</a></div>

      <div className="sidebar-section">
        <div className="sidebar-label-with-edit">
          <p className="sidebar-label">프로필</p>
          <img src={edit} alt="수정 아이콘" className="edit-icon" onClick={() => navigate('/userinfo', { state: { from: location.pathname } })} />
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
            <Link to="/complaints/history">
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
