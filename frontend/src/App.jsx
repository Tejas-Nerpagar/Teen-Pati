import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GameTable from './pages/GameTable';

const PrivateRoute = ({ children }) => {
  const { token, loading } = useAuth();
  if (loading) return <div className="text-white text-center mt-20">Loading...</div>;
  return token ? children : <Navigate to="/login" />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route 
        path="/" 
        element={
          <PrivateRoute>
             <Dashboard />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/room/:id" 
        element={
          <PrivateRoute>
             <GameTable />
          </PrivateRoute>
        } 
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <div className="min-h-screen bg-gray-900 text-gray-100 font-sans selection:bg-indigo-500/30">
            <AppRoutes />
          </div>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
