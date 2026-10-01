import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Ticket,
  Calendar,
  Layers,
  MapPin,
  Heart,
  Bell,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Shield,
  Briefcase,
  ChevronDown,
  Database,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notificationApi } from '../../services/userActionsApi';
import { Badge } from '../common/Badge';

export const Navbar: React.FC = () => {
  const { user, role, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      notificationApi
        .getNotifications()
        .then((res) => {
          const list = Array.isArray(res) ? res : (res && res.items) || [];
          setUnreadCount(list.filter((n) => !n.is_read).length);
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
    navigate('/');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors hover:text-white flex items-center gap-1.5 ${
      isActive ? 'text-indigo-400 font-semibold' : 'text-slate-300'
    }`;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20 transition-transform group-hover:scale-105">
            <Ticket className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-white block leading-none">
              EVENT<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">HUB</span>
            </span>
            <span className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
              DBMS Event Platform
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-7">
          <NavLink to="/events" className={navLinkClass}>
            <Calendar className="w-4 h-4" />
            Events
          </NavLink>
          <NavLink to="/categories" className={navLinkClass}>
            <Layers className="w-4 h-4" />
            Categories
          </NavLink>
          <NavLink to="/venues" className={navLinkClass}>
            <MapPin className="w-4 h-4" />
            Venues
          </NavLink>
          <NavLink to="/database" className={navLinkClass}>
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Database</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 font-bold">
              DBMS
            </span>
          </NavLink>
        </nav>

        {/* Right Action Section */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              {/* Notifications quick badge */}
              <Link
                to="/notifications"
                className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </Link>

              {/* Favorites quick link */}
              <Link
                to="/favorites"
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
                title="Favorites"
              >
                <Heart className="w-5 h-5" />
              </Link>

              {/* Role Indicator / Dashboard shortcuts */}
              {role === 'ORGANIZER' && (
                <Link
                  to="/organizer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 hover:bg-violet-500/20 transition-colors"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  Organizer Portal
                </Link>
              )}
              {role === 'ADMIN' && (
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 transition-colors"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin Console
                </Link>
              )}

              {/* User Menu Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 transition-colors"
                >
                  <div className="w-6 h-6 rounded-lg bg-indigo-600/40 text-indigo-300 flex items-center justify-center font-bold text-xs">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold max-w-[120px] truncate">{user.full_name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="text-xs font-semibold text-white truncate">{user.full_name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      <Badge variant="primary" size="sm" className="mt-1.5">
                        {role}
                      </Badge>
                    </div>

                    <div className="py-1 text-xs text-slate-300">
                      <Link
                        to="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-indigo-400" />
                        Customer Dashboard
                      </Link>
                      <Link
                        to="/my-bookings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        <Calendar className="w-4 h-4 text-emerald-400" />
                        My Bookings
                      </Link>
                      <Link
                        to="/my-tickets"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        <Ticket className="w-4 h-4 text-violet-400" />
                        My Tickets
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        Profile Settings
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-slate-800">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-xs font-semibold px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/25 border border-indigo-400/30 transition-all"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu hamburger */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 pt-3 pb-6 flex flex-col gap-3 animate-in slide-in-from-top-4 duration-200">
          <NavLink
            to="/events"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-900"
          >
            <Calendar className="w-4 h-4 text-indigo-400" />
            Events
          </NavLink>
          <NavLink
            to="/categories"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-900"
          >
            <Layers className="w-4 h-4 text-indigo-400" />
            Categories
          </NavLink>
          <NavLink
            to="/venues"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-900"
          >
            <MapPin className="w-4 h-4 text-indigo-400" />
            Venues
          </NavLink>
          <NavLink
            to="/database"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-900"
          >
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Database Portal</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
              DBMS
            </span>
          </NavLink>

          {isAuthenticated && user ? (
            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
              <div className="px-3 py-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-white">{user.full_name}</span>
                <Badge variant="primary" size="sm">
                  {role}
                </Badge>
              </div>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-900"
              >
                Dashboard
              </Link>
              <Link
                to="/my-bookings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-900"
              >
                My Bookings
              </Link>
              <Link
                to="/my-tickets"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-900"
              >
                My Tickets
              </Link>
              <Link
                to="/favorites"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-900"
              >
                Favorites
              </Link>
              <Link
                to="/notifications"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-900"
              >
                Notifications
              </Link>
              {role === 'ORGANIZER' && (
                <Link
                  to="/organizer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-violet-400 hover:bg-violet-950/30"
                >
                  <Briefcase className="w-4 h-4" />
                  Organizer Portal
                </Link>
              )}
              {role === 'ADMIN' && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-950/30"
                >
                  <Shield className="w-4 h-4" />
                  Admin Console
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-950/30 text-left mt-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl border border-slate-800 text-sm font-medium text-slate-200"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium shadow-lg shadow-indigo-600/25"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
