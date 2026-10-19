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
import CalendarPage from "../pages/user/CalendarPage";
import DashboardPage from "../pages/user/DashboardPage";
import ProfilePage from "../pages/user/ProfilePage";
import ProjectPage from "../pages/user/ProjectPage";
import ProjectsPage from "../pages/user/ProjectsPage";
import TaskFormPage from "../pages/user/TaskFormPage";
import TaskListPage from "../pages/user/TaskListPage";
import SchedulePage from "../pages/user/SchedulePage";
import TimerPage from "../pages/user/TimerPage";
import TrackerPage from "../pages/user/TrackerPage";
import OnboardingPage from "../pages/public/OnboardingPage";

import AdminRoute from "./AdminRoute";
import ProtectedRoute from "./ProtectedRoute";

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route element={<LandingPage />} path="/" />
        <Route element={<LoginPage initialMode="login" />} path="/login" />
        <Route element={<LoginPage initialMode="signup" />} path="/signup" />
        <Route element={<LoginPage initialMode="signup" />} path="/register" />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<OnboardingPage />} path="/onboarding" />
        <Route element={<AppLayout />}>
          <Route element={<Navigate replace to="/dashboard" />} path="/app" />
          <Route element={<DashboardPage />} path="/dashboard" />
          <Route element={<TaskListPage />} path="/tasks" />
          <Route element={<TaskFormPage />} path="/tasks/new" />
          <Route element={<TaskFormPage />} path="/tasks/:id/edit" />
          {/* /my-tasks is the personal flat task list — same view as /tasks */}
          <Route element={<TaskListPage />} path="/my-tasks" />
          <Route element={<SchedulePage />} path="/schedule" />
          <Route element={<CalendarPage />} path="/calendar" />
          <Route element={<TimerPage />} path="/timer" />
          <Route element={<TrackerPage />} path="/tracker" />
          <Route element={<ProjectsPage />} path="/projects" />
          <Route element={<ProjectPage />} path="/projects/:projectId" />
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
