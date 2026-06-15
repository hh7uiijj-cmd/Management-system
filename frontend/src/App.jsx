import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import MyRegistrations from './pages/MyRegistrations';
import Approval from './pages/Approval';
import EventManagement from './pages/admin/EventManagement';
import UserManagement from './pages/admin/UserManagement';
import RoleManagement from './pages/admin/RoleManagement';

function Layout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="events" element={<Events />} />
            <Route path="events/:id" element={<EventDetail />} />
            <Route path="my-registrations" element={<MyRegistrations />} />
            <Route
              path="approval"
              element={
                <ProtectedRoute requiredPermission="approve_registrations">
                  <Approval />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/events"
              element={
                <ProtectedRoute requiredPermission="manage_events">
                  <EventManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/users"
              element={
                <ProtectedRoute requiredPermission="manage_users">
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/roles"
              element={
                <ProtectedRoute requiredPermission="manage_roles">
                  <RoleManagement />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
