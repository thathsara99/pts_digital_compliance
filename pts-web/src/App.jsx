import React, { useState, useEffect } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import MainLayout from "./components/MainLayout";
import Home from "./pages/Home";
import Templates from "./pages/Templates";
import User from "./pages/User";
import Login from "./pages/Login";
import Profile from "./pages/profile";
import ForgotPasswordPage from "./pages/ForgotPassword";
import EmpployeeManagement from "./pages/EmployeeManagment";
import LeaveManagment from "./pages/Leave Managment";
import DocumentHub from "./pages/DocumentHub";
import Department from "./pages/Department";
import CompanyProfile from "./pages/CompanyProfile";
import Attendance from "./pages/Attendance";
import Menue from "./pages/Menue";
import { isTokenValid, clearAuthToken } from "./utils/auth";

function App() {
  const location = useLocation();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on app load
  useEffect(() => {
    const checkAuthStatus = () => {
      if (isTokenValid()) {
        setIsAuthenticated(true);
      } else {
        // Clear expired tokens
        clearAuthToken();
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  // Handle login success
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  // Handle logout
  const handleLogout = () => {
    clearAuthToken();
    setIsAuthenticated(false);
  };

  // Show loading while checking auth status
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated && location.pathname !== "/login" && location.pathname !== "/forgot-password") {
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/menue" element={<Menue />} />

      {/* Protected Routes */}
      <Route
        path="/home"
        element={
          <MainLayout onLogout={handleLogout}>
            <Home />
          </MainLayout>
        }
      />
      <Route
        path="/"
        element={
          <MainLayout onLogout={handleLogout}>
            <Home />
          </MainLayout>
        }
      />
      <Route
        path="/templates"
        element={
          <MainLayout onLogout={handleLogout}>
            <Templates />
          </MainLayout>
        }
      />
      <Route
        path="/users"
        element={
          <MainLayout onLogout={handleLogout}>
            <User />
          </MainLayout>
        }
      />
      <Route
        path="/employee"
        element={
          <MainLayout onLogout={handleLogout}>
            <EmpployeeManagement />
          </MainLayout>
        }
      />
      <Route
        path="/leave"
        element={
          <MainLayout onLogout={handleLogout}>
            <LeaveManagment />
          </MainLayout>
        }
      />
      <Route
        path="/documents"
        element={
          <MainLayout onLogout={handleLogout}>
            <DocumentHub />
          </MainLayout>
        }
      />
      <Route
        path="/department"
        element={
          <MainLayout onLogout={handleLogout}>
            <Department />
          </MainLayout>
        }
      />
      <Route
        path="/companyprofile"
        element={
          <MainLayout onLogout={handleLogout}>
            <CompanyProfile />
          </MainLayout>
        }
      />
      <Route
        path="/attendance"
        element={
          <MainLayout onLogout={handleLogout}>
            <Attendance />
          </MainLayout>
        }
      />
      <Route
        path="/profile"
        element={
          <MainLayout onLogout={handleLogout}>
            <Profile />
          </MainLayout>
        }
      />
    </Routes>
    
  );
}

export default App;
