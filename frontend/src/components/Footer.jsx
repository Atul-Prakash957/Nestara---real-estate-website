import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Facebook, Instagram, Linkedin, Twitter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api/services';

export default function Footer() {
  const { user } = useAuth();
  const [recentSearches, setRecentSearches] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [shortlisted, setShortlisted] = useState([]);

  useEffect(() => {
    if (!user) return;
    userApi.recentSearches().then((res) => setRecentSearches(res.data.searches || [])).catch(() => {});
    userApi.recentlyViewed().then((res) => setRecentlyViewed(res.data.properties || [])).catch(() => {});
    userApi.shortlist().then((res) => setShortlisted(res.data.properties || [])).catch(() => {});
  }, [user]);

  return (
    <footer className="mt-16 bg-navy-dark text-white/70">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <FooterColumn title="Recently Searched">
            {recentSearches.length === 0 && <EmptyNote text="Your searches will appear here" />}
            {recentSearches.slice(0, 5).map((s, i) => (
              <FooterLink key={i} to={`/search?q=${encodeURIComponent(s.search_query)}`} label={s.search_query} />
            ))}
          </FooterColumn>

          <FooterColumn title="Recently Viewed">
            {recentlyViewed.length === 0 && <EmptyNote text="Properties you view will appear here" />}
            {recentlyViewed.slice(0, 5).map((p) => (
              <FooterLink key={p.id} to={`/property/${p.id}`} label={p.title} />
            ))}
          </FooterColumn>

          <FooterColumn title="Shortlisted">
            {shortlisted.length === 0 && <EmptyNote text="Save properties to see them here" />}
            {shortlisted.slice(0, 5).map((p) => (
              <FooterLink key={p.id} to={`/property/${p.id}`} label={p.title} />
            ))}
          </FooterColumn>

          <FooterColumn title="Company">
            <FooterLink to="/about" label="About Us" />
            <FooterLink to="/contact" label="Contact Us" />
            <FooterLink to="/post-property" label="Post Property Free" />
            <FooterLink to="/terms" label="Terms & Conditions" />
          </FooterColumn>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-coral text-sm font-bold text-white">N</div>
            <span className="font-display text-sm font-semibold text-white">Nestara</span>
            <span className="text-xs text-white/40">© {new Date().getFullYear()} All rights reserved</span>
          </div>
          <div className="flex items-center gap-4">
            <Facebook size={18} className="cursor-pointer hover:text-white" />
            <Instagram size={18} className="cursor-pointer hover:text-white" />
            <Twitter size={18} className="cursor-pointer hover:text-white" />
            <Linkedin size={18} className="cursor-pointer hover:text-white" />
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }) {
  return (
    <div>
      <h4 className="mb-3 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-white">
        {title}
      </h4>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

function FooterLink({ to, label }) {
  return (
    <li>
      <Link to={to} className="line-clamp-1 text-sm text-white/60 hover:text-coral">
        {label}
      </Link>
    </li>
  );
}

function EmptyNote({ text }) {
  return <li className="flex items-center gap-1.5 text-xs text-white/35"><Building2 size={12} /> {text}</li>;
}