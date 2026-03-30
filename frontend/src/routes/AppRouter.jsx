import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "../layouts/AppLayout";
import AdminLayout from "../layouts/AdminLayout";
import PublicLayout from "../layouts/PublicLayout";
import NotFoundPage from "../pages/NotFoundPage";
import BackupManagementPage from "../pages/admin/BackupManagementPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import SecurityMonitoringPage from "../pages/admin/SecurityMonitoringPage";
import StorageMonitoringPage from "../pages/admin/StorageMonitoringPage";
import UserManagementPage from "../pages/admin/UserManagementPage";
import LandingPage from "../pages/public/LandingPage";
import LoginPage from "../pages/public/LoginPage";
import VerifyEmailPage from "../pages/public/VerifyEmailPage";
import DashboardPage from "../pages/user/DashboardPage";
import ProfilePage from "../pages/user/ProfilePage";
import TaskFormPage from "../pages/user/TaskFormPage";
import TaskListPage from "../pages/user/TaskListPage";

import AdminRoute from "./AdminRoute";
import ProtectedRoute from "./ProtectedRoute";

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route element={<LandingPage />} path="/" />
        <Route element={<LoginPage />} path="/login" />
        <Route element={<VerifyEmailPage />} path="/verify-email" />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route element={<Navigate replace to="/dashboard" />} path="/app" />
          <Route element={<DashboardPage />} path="/dashboard" />
          <Route element={<TaskListPage />} path="/tasks" />
          <Route element={<TaskFormPage />} path="/tasks/new" />
          <Route element={<TaskFormPage />} path="/tasks/:id/edit" />
          <Route element={<ProfilePage />} path="/profile" />

          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />} path="/admin">
              <Route element={<AdminDashboardPage />} index />
              <Route element={<UserManagementPage />} path="users" />
              <Route element={<SecurityMonitoringPage />} path="security" />
              <Route element={<StorageMonitoringPage />} path="storage" />
              <Route element={<BackupManagementPage />} path="backups" />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route element={<NotFoundPage />} path="*" />
    </Routes>
  );
}
