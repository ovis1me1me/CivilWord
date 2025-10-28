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
import { FolderOpen, TableOfContents, LogOut, Mail, Phone, Search, Smile, SquarePen} from 'lucide-react';

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
          <SquarePen className="edit-icon" onClick={() => navigate('/userinfo', { state: { from: location.pathname } })} />
        </div>
        <ul>
          <li>{<Smile size={20} className="text-white drop-shadow-md" />} {userInfo.name}</li>
          <li>{<Search size={20} className="text-white drop-shadow-md" />} {userInfo.department}</li>
          <li>{<Phone size={20} className="text-white drop-shadow-md" />}{userInfo.contact}</li>
          <li>{<Mail size={20} className="text-white drop-shadow-md" />} {userInfo.email}</li>
        </ul>
      </div>

      <div className="sidebar-section">
        <p className="sidebar-label">저장소</p>
        <ul>
          <li>
            <Link to="/complaints">
              {<TableOfContents size={20} className="text-white drop-shadow-md" />} 민원 목록
            </Link>
          </li>
          <li>
            <Link to="/complaints/history">
              {<FolderOpen size={20} className="text-white drop-shadow-md" />} 히스토리
            </Link>
          </li>
        </ul>
      </div>

      <div className="sidebar-footer">
        <button onClick={handleLogout}>
          {<LogOut size={20} className="text-white drop-shadow-md" />} 로그아웃
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
