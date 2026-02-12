import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserRole } from '../types';
import { LayoutDashboard, Dumbbell, Calendar, CalendarClock, LogOut, Menu, X, Globe, ShoppingBag, Package, Home, Users, User, MessageCircle, History } from 'lucide-react';
import { signOut } from '../services/supabase';
import NotificationBell from './NotificationBell';

const Layout: React.FC = () => {
  const { userProfile, activeRole } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try { await signOut(); navigate('/login'); } catch (e) { console.error("Logout failed", e); }
  };

  const toggleLanguage = () => setLanguage(language === 'en' ? 'de' : 'en');

  const effectiveRole = activeRole || userProfile?.role;
  const isAthlete = effectiveRole === UserRole.ATHLETE;
  const isCoach = effectiveRole === UserRole.COACH;
  const isAdmin = effectiveRole === UserRole.ADMIN;

  // ======================== ROLE-BASED NAV ITEMS ========================

  const handleAthleteNav = (view: 'hub' | 'training') => {
    navigate('/', { state: { view } });
  };

  const currentView = location.state?.view || 'hub';
  const isDashboardRoute = location.pathname === '/';

  // --- Sidebar Nav (Desktop) — all items per role ---
  const sidebarNav = isAthlete ? [
    { label: 'Home', path: '/', icon: <Home size={20} />, onClick: () => handleAthleteNav('hub') },
    { label: 'Training', path: '/__training__', icon: <Calendar size={20} />, onClick: () => handleAthleteNav('training') },
    { label: 'Shop', path: '/shop', icon: <ShoppingBag size={20} /> },
    { label: 'Chat', path: '/chat', icon: <MessageCircle size={20} /> },
    { label: 'Profil', path: '/profile', icon: <User size={20} /> },
  ] : [
    { label: t('nav.dashboard'), path: '/', icon: <LayoutDashboard size={20} /> },
    { label: t('nav.exercises'), path: '/exercises', icon: <Dumbbell size={20} /> },
    { label: t('nav.planner'), path: '/planner', icon: <Calendar size={20} /> },
    { label: t('nav.products'), path: '/admin/products', icon: <Package size={20} /> },
    { label: 'Kalender', path: '/calendar', icon: <CalendarClock size={20} /> },
    { label: 'Chat', path: '/coach/chat', icon: <MessageCircle size={20} /> },
    { label: 'CRM', path: '/admin/crm', icon: <Users size={20} /> },
    { label: 'Profil', path: '/profile', icon: <User size={20} /> },
  ];

  // --- Mobile Bottom Nav (5 items max for native feel) ---
  const mobileNav = isAthlete ? [
    { label: 'Home', path: '/', icon: <Home size={24} />, onClick: () => handleAthleteNav('hub'), isActive: isDashboardRoute && currentView === 'hub' },
    { label: 'Training', path: '/__training__', icon: <Calendar size={24} />, onClick: () => handleAthleteNav('training'), isActive: isDashboardRoute && currentView === 'training' },
    { label: 'Shop', path: '/shop', icon: <ShoppingBag size={24} /> },
    { label: 'Chat', path: '/chat', icon: <MessageCircle size={24} /> },
    { label: 'Profil', path: '/profile', icon: <User size={24} /> },
  ] : [
    { label: 'Home', path: '/', icon: <LayoutDashboard size={24} /> },
    { label: 'Planner', path: '/planner', icon: <Calendar size={24} /> },
    { label: 'Chat', path: '/coach/chat', icon: <MessageCircle size={24} /> },
    { label: 'CRM', path: '/admin/crm', icon: <Users size={24} /> },
    { label: 'Profil', path: '/profile', icon: <User size={24} /> },
  ];

  const roleLabel = isAdmin ? 'Admin Panel' : isCoach ? 'Coach Dashboard' : 'Athlete';

  // Helper: check if a sidebar item is active
  const isSidebarActive = (item: typeof sidebarNav[0]) => {
    if (item.path === '/__training__') return isDashboardRoute && currentView === 'training';
    if (item.path === '/' && isAthlete) return isDashboardRoute && currentView === 'hub';
    return location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
  };

  // Helper: check if a mobile item is active
  const isMobileActive = (item: typeof mobileNav[0]) => {
    if ('isActive' in item && item.isActive !== undefined) return item.isActive;
    if (item.path === '/') return location.pathname === '/';
    return location.pathname === item.path || location.pathname.startsWith(item.path);
  };

  // ======================== IMMERSIVE CHAT (Athlete) ========================
  const isImmersiveChat = isAthlete && location.pathname === '/chat';
  if (isImmersiveChat) {
    return (
      <div className="h-[100dvh] bg-[#0A0A0A] text-white flex flex-col font-sans selection:bg-[#00FF00] selection:text-black overflow-hidden">
        <Outlet />
      </div>
    );
  }

  // ======================== UNIFIED LAYOUT ========================
  return (
    <div className="min-h-screen flex bg-[#000000] text-white font-sans selection:bg-[#00FF00] selection:text-black overflow-x-hidden">

      {/* ============ DESKTOP SIDEBAR (All Roles, md+) ============ */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800 bg-[#000000] fixed h-full z-20">
        <div className="p-8">
          <h1 className="text-2xl font-bold text-white tracking-tighter">
            GREENLIGHT<span className="text-[#00FF00]">.</span>
          </h1>
          <div className="flex items-center justify-between mt-2">
            <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-medium">
              {roleLabel}
            </p>
            <NotificationBell />
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
          {sidebarNav.map((item) => {
            const active = isSidebarActive(item);
            if (item.onClick) {
              return (
                <button
                  key={item.path}
                  onClick={item.onClick}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 w-full text-left ${
                    active
                      ? 'bg-[#00FF00] text-black font-semibold shadow-[0_0_15px_rgba(0,255,0,0.3)]'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            }
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={() =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    active
                      ? 'bg-[#00FF00] text-black font-semibold shadow-[0_0_15px_rgba(0,255,0,0.3)]'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-900 space-y-2">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-3 px-4 py-2 text-zinc-500 hover:text-white transition-colors w-full text-sm"
          >
            <Globe size={18} />
            <span>{language === 'en' ? 'Deutsch' : 'English'}</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 text-zinc-500 hover:text-red-400 transition-colors w-full text-sm"
          >
            <LogOut size={18} />
            <span>{t('nav.logout')}</span>
          </button>
          <div className="pt-2 text-[10px] text-zinc-600 flex gap-2 justify-center">
            <Link to="/legal/imprint" className="hover:text-zinc-400">Impressum</Link>
            <span>•</span>
            <Link to="/legal/privacy" className="hover:text-zinc-400">Datenschutz</Link>
          </div>
        </div>
      </aside>

      {/* ============ MOBILE TOP BAR (All Roles, <md) ============ */}
      <div className="md:hidden fixed top-0 w-full bg-[#000000]/95 backdrop-blur-md border-b border-zinc-800/50 z-30 safe-area-top">
        <div className="px-5 py-3 flex justify-between items-center">
          <h1 className="text-lg font-bold text-white tracking-tighter">
            GREENLIGHT<span className="text-[#00FF00]">.</span>
          </h1>
          <div className="flex gap-2 items-center">
            <NotificationBell />
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white hover:text-[#00FF00] transition-colors p-2 -mr-2">
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* ============ MOBILE FULLSCREEN MENU (All Roles) ============ */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-[#000000]/98 backdrop-blur-xl z-40 animate-in fade-in duration-200 safe-area-top" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="pt-20 px-5 pb-32" onClick={e => e.stopPropagation()}>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 px-2">Navigation</p>
            <nav className="space-y-1">
              {sidebarNav.map((item) => {
                const active = isSidebarActive(item);
                if (item.onClick) {
                  return (
                    <button
                      key={item.path}
                      onClick={() => { item.onClick!(); setIsMobileMenuOpen(false); }}
                      className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all w-full text-left ${
                        active ? 'bg-[#00FF00] text-black font-bold' : 'text-zinc-300 hover:bg-zinc-900 active:bg-zinc-800'
                      }`}
                    >
                      {item.icon}
                      <span className="text-base font-medium">{item.label}</span>
                    </button>
                  );
                }
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={() =>
                      `flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all ${
                        active ? 'bg-[#00FF00] text-black font-bold' : 'text-zinc-300 hover:bg-zinc-900 active:bg-zinc-800'
                      }`
                    }
                  >
                    {item.icon}
                    <span className="text-base font-medium">{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="border-t border-zinc-800 mt-6 pt-6 space-y-2">
              <button onClick={toggleLanguage} className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-zinc-900 rounded-2xl w-full transition-colors">
                <Globe size={18} />
                <span className="font-medium">{language === 'en' ? 'Deutsch' : 'English'}</span>
              </button>
              <button
                onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-2xl w-full transition-colors"
              >
                <LogOut size={18} />
                <span className="font-medium">{t('nav.logout')}</span>
              </button>
              <div className="text-[10px] text-zinc-600 flex gap-2 justify-center pt-2">
                <Link to="/legal/imprint" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-zinc-400">Impressum</Link>
                <span>•</span>
                <Link to="/legal/privacy" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-zinc-400">Datenschutz</Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ MOBILE BOTTOM NAV — Floating Glassmorphism (All Roles) ============ */}
      <div className="md:hidden fixed bottom-0 w-full z-40 px-4 pb-6 pt-2 pointer-events-none safe-area-bottom">
        <div className="max-w-lg mx-auto pointer-events-auto">
          <div className="bg-[#1C1C1E]/95 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl flex justify-between items-center px-5 py-3.5">
            {mobileNav.map((item) => {
              const active = isMobileActive(item);
              if ('onClick' in item && item.onClick) {
                return (
                  <button
                    key={item.path}
                    onClick={item.onClick}
                    className={`flex flex-col items-center gap-0.5 transition-all duration-300 ${active ? 'text-[#00FF00] scale-110' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    {item.icon}
                  </button>
                );
              }
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={() =>
                    `flex flex-col items-center gap-0.5 transition-all duration-300 ${active ? 'text-[#00FF00] scale-110' : 'text-zinc-500 hover:text-zinc-300'}`
                  }
                >
                  {item.icon}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============ MAIN CONTENT ============ */}
      <main className="flex-1 md:ml-64 p-4 md:p-6 pt-20 md:pt-8 pb-28 md:pb-8 bg-[#000000] min-w-0 safe-area-top">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;