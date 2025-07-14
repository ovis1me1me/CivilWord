import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import UserInfo from './pages/UserInfo';
import UploadExcel from './pages/upload_excel';
import FindId from './pages/FindId';
import FindPassword from "./pages/FindPassword";
import ResetPassword from "./pages/ResetPassword";
import Layout from './pages/Layout';
import ComplaintListPage from './pages/ComplaintListPage';
import ComplaintDetailPage from './pages/ComplaintDetailPage';
import AnswerSelectPage from './pages/AnswerSelectPage';
import EmptyPage from './pages/EmptyPage';
import HistoryPage from './pages/HistoryPage';
import AdminRepliesPage from './pages/AdminRepliesPage';
import HistoryDetailPage from './pages/HistoryDetailPage';
import { useState } from "react";

function App() {
  const [userId, setUserId] = useState("");
  const [question, setQuestion] = useState("");

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/Login" />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/Register" element={<Register />} />
        <Route path="/FindId" element={<FindId />} />
        <Route path="/FindPassword" element={
          userId && question ? (
            <ResetPassword userId={userId} question={question} />
          ) : (
            <FindPassword onQuestionFound={(uid, q) => {
              setUserId(uid);
              setQuestion(q);
            }} />
          )
        } />
        <Route path="/userinfo" element={<Layout><UserInfo /></Layout>} />
        <Route path="/upload_excel" element={<Layout><UploadExcel /></Layout>} />
        <Route path="/complaints" element={<Layout><ComplaintListPage /></Layout>} />
        <Route path="/complaints/:id" element={<Layout><ComplaintDetailPage /></Layout>} />
        <Route path="/complaints/:id/select-answer" element={<Layout><AnswerSelectPage /></Layout>} />
        <Route path="/complaints/history" element={<Layout><HistoryPage /></Layout>} />
        <Route path="/complaints/history/:id" element={<Layout><HistoryDetailPage /></Layout>} />
        <Route path="/complaints/admin/replies" element={<Layout><AdminRepliesPage /></Layout>} />
        <Route path="*" element={<Layout><EmptyPage /></Layout>} />
      </Routes>
    </Router>
  );
}

export default App;