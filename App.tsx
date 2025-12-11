import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { User } from './types';
import { DataProvider } from './context/DataContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Transactions from './pages/Transactions';
import { LayoutDashboard, Wallet, Receipt, LogOut, Menu, X } from 'lucide-react';
import { auth } from './firebaseConfig';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';

// Authentication Context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
}
export const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const authCtx = React.useContext(AuthContext);
  
  if (authCtx?.loading) {
      return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }
  
  return authCtx?.user ? <>{children}</> : <Navigate to="/login" />;
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const auth = React.useContext(AuthContext);
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: '總覽報表', icon: <LayoutDashboard size={20} /> },
    { path: '/accounts', label: '帳戶管理', icon: <Wallet size={20} /> },
    { path: '/transactions', label: '收支紀錄', icon: <Receipt size={20} /> },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-white border-b z-20 flex justify-between items-center p-4">
        <h1 className="text-xl font-bold text-brand-600">WealthFlow</h1>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-10 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        pt-16 md:pt-0
      `}>
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center px-6 border-b md:flex hidden">
            <h1 className="text-2xl font-bold text-brand-600 flex items-center gap-2">
              WealthFlow
            </h1>
          </div>
          
          <div className="p-4 border-b bg-gray-50">
             <div className="text-sm text-gray-500">歡迎回來,</div>
             <div className="font-semibold text-gray-800 truncate">{auth?.user?.name || auth?.user?.username}</div>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path) 
                    ? 'bg-brand-50 text-brand-600 font-medium' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t">
            <button
              onClick={auth?.logout}
              className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              登出
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0 w-full">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

       {/* Overlay for mobile */}
       {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-0 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Map Firebase User to our App User
        const appUser: User = {
          id: firebaseUser.uid,
          username: firebaseUser.email || '',
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          passwordHash: '' // Not needed for Firebase
        };
        setUser(appUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      <DataProvider userId={user?.id || null}>
        <HashRouter>
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/" element={
              <PrivateRoute>
                <Layout><Dashboard /></Layout>
              </PrivateRoute>
            } />
            <Route path="/accounts" element={
              <PrivateRoute>
                <Layout><Accounts /></Layout>
              </PrivateRoute>
            } />
            <Route path="/transactions" element={
              <PrivateRoute>
                <Layout><Transactions /></Layout>
              </PrivateRoute>
            } />
          </Routes>
        </HashRouter>
      </DataProvider>
    </AuthContext.Provider>
  );
};

export default App;
