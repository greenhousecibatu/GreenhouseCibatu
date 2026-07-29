import React from 'react';
import { useApp } from './context/AppContext';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import ToastContainer from './components/ToastContainer';
import Dashboard from './pages/Dashboard';
import Schedules from './pages/Schedules';
import History from './pages/History';
import Settings from './pages/Settings';

function App() {
    const { currentPage } = useApp();

    const renderActivePage = () => {
        switch (currentPage) {
            case 'dashboard':
                return <Dashboard />;
            case 'schedules':
                return <Schedules />;
            case 'history':
                return <History />;
            case 'settings':
                return <Settings />;
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
