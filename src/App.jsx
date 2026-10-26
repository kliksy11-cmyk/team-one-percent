import React, { useState, useEffect } from 'react';
import {
  Home as HomeIcon,
  Calendar,
  Target,
  ShoppingBag,
  MessageSquare,
  Trophy,
  Flame,
  Coins,
  Sparkles,
  LogOut,
  Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sb } from './supabaseClient';
import Logo from './Logo';
import Home from './Home';
import AIChat from './AIChat';
import Login from './Login';
import Schedule from './Schedule';
import Goals from './Goals';
import Store from './Store';
import Ranks from './Ranks';
import Feed from './Feed';
import Team from './Team';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isTeamOpen, setIsTeamOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const savedUser = localStorage.getItem('team_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      fetchProfile(parsedUser.id);
    }
  }, []);

  const fetchProfile = async (userId) => {
    const { data } = await sb
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) setProfile(data);
  };

  const handleLogout = () => {
    localStorage.removeItem('team_user');
    setUser(null);
    setProfile(null);
  };

  const tabs = [
    { id: 'home', icon: HomeIcon, label: 'Home' },
    { id: 'schedule', icon: Calendar, label: 'Schedule' },
    { id: 'goals', icon: Target, label: 'Goals' },
    { id: 'store', icon: ShoppingBag, label: 'Store' },
    { id: 'feed', icon: MessageSquare, label: 'Feed' },
    { id: 'ranks', icon: Trophy, label: 'Ranks' },
  ];

  if (!user)
    return (
      <Login
        onLogin={(u) => {
          setUser(u);
          fetchProfile(u.id);
        }}
      />
    );

  return (
    <div
      style={{
        maxWidth: '600px',
        margin: '0 auto',
        minHeight: '100vh',
        position: 'relative',
        color: '#fff',
        zIndex: 1,
      }}
    >
      <div className="app-background"></div>

      {/* HEADER */}
      <header
        className="glass"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
        >
          <Logo size={32} />
          <h1
            className="serif"
            style={{ color: '#fff', fontSize: '22px', margin: 0 }}
          >
            TEAM <span style={{ color: '#F4B41A' }}>1%</span>
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ display: 'flex', gap: '16px', alignItems: 'center' }}
        >
          <button
            onClick={() => setIsTeamOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: profile?.team_id ? '#F4B41A' : '#8E9EBA',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Users size={18} />
          </button>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#F4B41A',
              fontSize: '14px',
              fontWeight: '800',
            }}
          >
            <Coins size={16} strokeWidth={2.5} /> {profile?.coins || 0}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '800',
            }}
          >
            <Flame size={16} strokeWidth={2.5} /> {profile?.login_streak || 0}
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              color: '#8E9EBA',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <LogOut size={18} />
          </button>
        </motion.div>
      </header>

      {/* MAIN CONTENT */}
      <main
        style={{ paddingBottom: '120px', position: 'relative', zIndex: 10 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15, filter: 'blur(5px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -15, filter: 'blur(5px)' }}
            transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {activeTab === 'home' && (
              <Home
                key={refreshKey}
                user={user}
                profile={profile}
                refreshProfile={() => fetchProfile(user.id)}
                onLogout={handleLogout}
              />
            )}
            {activeTab === 'schedule' && (
              <Schedule
                user={user}
                profile={profile}
                refreshProfile={() => fetchProfile(user.id)}
              />
            )}
            {activeTab === 'goals' && <Goals user={user} />}
            {activeTab === 'store' && (
              <Store
                user={user}
                profile={profile}
                refreshProfile={() => fetchProfile(user.id)}
              />
            )}
            {activeTab === 'feed' && <Feed user={user} profile={profile} />}
            {activeTab === 'ranks' && <Ranks user={user} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* FLOATING AI BUTTON */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsAIOpen(true)}
        style={{
          position: 'fixed',
          bottom: '110px',
          right: '20px',
          width: '64px',
          height: '64px',
          borderRadius: '32px',
          background: 'linear-gradient(135deg, #F4B41A, #D99A0C)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 40px rgba(244, 180, 26, 0.4)',
          cursor: 'pointer',
          zIndex: 40,
        }}
      >
        <Sparkles size={28} color="#060B19" strokeWidth={2.5} />
      </motion.button>

      {/* PREMIUM SLIDING NAVIGATION */}
      <nav
        className="glass-nav"
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '500px',
          display: 'flex',
          justifyContent: 'space-around',
          padding: '10px',
          zIndex: 50,
          borderRadius: '30px',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                position: 'relative',
                width: '60px',
                padding: '10px 0',
              }}
            >
              {/* THE SLIDING PILL */}
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: '#1E2B4D',
                    borderRadius: '20px',
                    zIndex: -1,
                  }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}

              <Icon
                size={22}
                color={isActive ? '#F4B41A' : '#52525B'}
                strokeWidth={isActive ? 2.5 : 2}
                style={{ transition: 'all 0.2s' }}
              />
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  color: isActive ? '#F4B41A' : '#52525B',
                  transition: 'all 0.2s',
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* MODALS */}
      <AIChat
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        user={user}
        profile={profile}
        onTasksGenerated={() => setRefreshKey((prev) => prev + 1)}
      />
      <Team
        isOpen={isTeamOpen}
        onClose={() => setIsTeamOpen(false)}
        user={user}
        profile={profile}
        refreshProfile={() => fetchProfile(user.id)}
      />
    </div>
  );
}
