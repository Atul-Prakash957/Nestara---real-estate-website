import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-16 bg-navy-dark text-white/70">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
          <FooterLink to="/about" label="About Us" />
          <FooterLink to="/contact" label="Contact Us" />
          <FooterLink to="/terms" label="Terms & Conditions" />
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
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

function FooterLink({ to, label }) {
  return (
    <Link to={to} className="text-sm text-white/60 hover:text-coral">
      {label}
    </Link>
  );
}