import React, { useState, useEffect } from 'react';
import { useApp } from './context/AppContext';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import ToastContainer from './components/ToastContainer';
import Dashboard from './pages/Dashboard';
import Schedules from './pages/Schedules';
import History from './pages/History';
import Settings from './pages/Settings';
import Login from './pages/Login';

function App() {
    const { currentPage } = useApp();
    const [token, setToken] = useState(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    // On mount, check if a valid token exists in localStorage
    useEffect(() => {
        const savedToken = localStorage.getItem('gh_token');
        if (savedToken) {
            // Verify token with backend
            fetch('/api/auth/verify', {
                headers: { 'Authorization': `Bearer ${savedToken}` }
            })
            .then(res => {
                if (res.ok) {
                    setToken(savedToken);
                } else {
                    localStorage.removeItem('gh_token');
                }
            })
            .catch(() => {
                // If server is not reachable, still allow cached token
                setToken(savedToken);
            })
            .finally(() => setIsCheckingAuth(false));
        } else {
            setIsCheckingAuth(false);
        }
    }, []);

    const handleLogin = (newToken) => {
        setToken(newToken);
    };

    const handleLogout = () => {
        localStorage.removeItem('gh_token');
        setToken(null);
    };

    // Loading splash while checking auth
    if (isCheckingAuth) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-primary-container flex items-center justify-center mx-auto">
                        <span className="material-symbols-outlined text-on-primary-container text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
                    </div>
                    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
                </div>
            </div>
        );
    }

    // If not authenticated, show Login page
    if (!token) {
        return <Login onLogin={handleLogin} />;
    }

    const renderActivePage = () => {
        switch (currentPage) {
            case 'dashboard':
                return <Dashboard />;
            case 'schedules':
                return <Schedules />;
            case 'history':
                return <History />;
            case 'settings':
                return <Settings onLogout={handleLogout} />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <div className="min-h-screen bg-background pb-24">
            <Header />
            <ToastContainer />
            <main className="max-w-md mx-auto pt-20 px-container-padding pb-8">
                {renderActivePage()}
            </main>
            <BottomNav />
        </div>
    );
}

export default App;
