import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MyCourses from './pages/MyCourses';
import CourseDetail from './pages/CourseDetail';
import LessonPlayer from './pages/LessonPlayer';
import Profile from './pages/Profile';
import Certificates from './pages/Certificates';
import { useScreenInit } from './useScreenInit';
import { ThemeProvider } from './components/ThemeProvider';
import { AuthProvider } from './context/AuthContext';
import Test from './pages/Test';
import QuizDetail from './pages/QuizDetail';
import Quizzes from './pages/Quizzes';
import QuizAttempt from './pages/QuizAttempt';

function ScreenInitWrapper({ children }: { children: React.ReactNode }) {
  useScreenInit();
  return <>{children}</>;
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScreenInitWrapper>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="courses" element={<MyCourses />} />
                  <Route path="courses/:moduleId/:courseId" element={<CourseDetail />} />
                  <Route path="quizzes" element={<Quizzes />} />
                  <Route path="quizzes/:quizId" element={<QuizDetail />} />
                  <Route path="quizzes/:quizId/attempt" element={<QuizAttempt />} />
                  <Route
                    path="courses/:courseId/lessons/:lessonId"
                    element={<LessonPlayer />}
                  />
                  <Route path="certificates" element={<Certificates />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="test" element={<Test />} />

                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ScreenInitWrapper>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}