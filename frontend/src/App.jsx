import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import NameEntry from './pages/NameEntry';
import Dashboard from './pages/Dashboard';
import GameTable from './pages/GameTable';

const PrivateRoute = ({ children }) => {
  const { username, loading } = useAuth();
  if (loading) return (
    <div className="flex h-screen items-center justify-center text-gray-400 text-sm">
      Loading...
    </div>
  );
  return username ? children : <Navigate to="/" replace />;
};

function AppRoutes() {
  const { username } = useAuth();
  return (
    <Routes>
      {/* Name entry — redirect to dashboard if already named */}
      <Route
        path="/"
        element={username ? <Navigate to="/dashboard" replace /> : <NameEntry />}
      />
      <Route
        path="/dashboard"
        element={<PrivateRoute><Dashboard /></PrivateRoute>}
      />
      <Route
        path="/room/:id"
        element={<PrivateRoute><GameTable /></PrivateRoute>}
      />
      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <div className="min-h-screen bg-gray-900 text-gray-100 font-sans selection:bg-amber-500/30">
            <AppRoutes />
          </div>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
