import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Stethoscope,
  Droplets,
  CloudSun,
  Bot
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const items = [
    { name: 'Overview', path: '/', icon: LayoutDashboard },
    { name: 'Doctor', path: '/disease', icon: Stethoscope },
    { name: 'Irrigate', path: '/irrigation', icon: Droplets },
    { name: 'Weather', path: '/weather', icon: CloudSun },
    { name: 'Assistant', path: '/assistant', icon: Bot },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 z-40 flex items-center justify-around px-2">
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full h-full py-1 text-[11px] font-medium transition ${
              isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <item.icon className="w-5 h-5 mb-0.5" />
          <span>{item.name}</span>
        </NavLink>
      ))}
    </nav>
  );
};
