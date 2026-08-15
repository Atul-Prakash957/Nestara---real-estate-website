import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronDown, Menu, X, Heart, Clock,
  Building2, LogOut, LayoutDashboard, PlusCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { label: 'Buy', to: '/search?listing_type=buy' },
  { label: 'Rent', to: '/search?listing_type=rent' },
  { label: 'Recently Added', to: '/search?sort=newest' },
];

export default function Header() {
  const { user, logout, isAdmin } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    setProfileOpen(false);
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-50 bg-navy shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-coral font-display text-lg font-800 text-white">
            N
          </div>
          <span className="font-display text-xl font-700 tracking-tight text-white">Nestara</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="rounded-lg px-3 py-2 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to={user ? '/post-property' : '/login?redirect=/post-property'}
            className="hidden items-center gap-1.5 rounded-lg bg-coral px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-coral-dark sm:flex"
          >
            <PlusCircle size={16} />
            Post Property <span className="hidden lg:inline">— FREE</span>
          </Link>

          {/* Profile / Auth */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-3 text-white hover:bg-white/15"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-teal text-xs font-bold uppercase">
                  {user.name?.[0] || 'U'}
                </span>
                <span className="hidden max-w-[100px] truncate text-sm sm:inline">{user.name}</span>
                <ChevronDown size={14} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-line bg-surface shadow-card-hover">
                  <div className="border-b border-line px-4 py-3">
                    <p className="truncate font-semibold text-ink">{user.name}</p>
                    <p className="truncate text-xs text-muted">{user.email}</p>
                  </div>
                  <MenuLink to="/profile?tab=listings" icon={<Building2 size={16} />} label="My Listings" onClick={() => setProfileOpen(false)} />
                  <MenuLink to="/profile?tab=shortlist" icon={<Heart size={16} />} label="Shortlisted Properties" onClick={() => setProfileOpen(false)} />
                  <MenuLink to="/profile?tab=viewed" icon={<Clock size={16} />} label="Recently Viewed" onClick={() => setProfileOpen(false)} />
                  {isAdmin && (
                    <MenuLink to="/admin" icon={<LayoutDashboard size={16} />} label="Admin Dashboard" onClick={() => setProfileOpen(false)} />
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10">
                Login
              </Link>
              <Link to="/register" className="rounded-lg border border-white/25 px-3 py-2 text-sm font-medium text-white hover:bg-white/10">
                Register
              </Link>
            </div>
          )}

          <button className="lg:hidden text-white" onClick={() => setMobileOpen((o) => !o)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-white/10 bg-navy-dark px-4 py-3 lg:hidden">
          {NAV_LINKS.map((link) => (
            <Link key={link.label} to={link.to} className="block py-2 text-sm text-white/90" onClick={() => setMobileOpen(false)}>
              {link.label}
            </Link>
          ))}
          <Link to={user ? '/post-property' : '/login'} className="mt-2 block rounded-lg bg-coral px-4 py-2 text-center text-sm font-semibold text-white">
            Post Property — FREE
          </Link>
          {!user && (
            <div className="mt-2 flex gap-2">
              <Link to="/login" className="flex-1 rounded-lg border border-white/25 py-2 text-center text-sm text-white">Login</Link>
              <Link to="/register" className="flex-1 rounded-lg border border-white/25 py-2 text-center text-sm text-white">Register</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

function MenuLink({ to, icon, label, onClick }) {
  return (
    <Link to={to} onClick={onClick} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink hover:bg-canvas">
      <span className="text-muted">{icon}</span>
      {label}
    </Link>
  );
}