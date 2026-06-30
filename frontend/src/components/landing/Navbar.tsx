import { Link } from 'react-router-dom';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="border-b border-zinc-200 dark:border-zinc-800/50 bg-white/90 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/favicon.svg" alt="Slate Logo" className="w-8 h-8" />
          <span className="font-bold text-xl tracking-tight text-zinc-900 dark:text-white transition-colors duration-300">Slate</span>
        </div>
        
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="#features" className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-sm">Features</a>
          <a href="#tech" className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-sm">Technology</a>
          <a href="#security" className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-sm">Security</a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <Link to="/app" className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-sm px-2 py-1">
            Sign In
          </Link>
          <Link to="/signup" className="text-sm font-medium px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950">
            Get Started
          </Link>
        </div>

        {/* Mobile Right Controls */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-300"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button 
            className="p-2 -mr-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md transition-colors duration-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800/50 bg-white dark:bg-zinc-950 absolute w-full left-0 top-16 shadow-xl shadow-black/10 dark:shadow-black/50 transition-colors duration-300">
          <div className="px-6 py-4 flex flex-col gap-4">
            <a href="#features" className="text-base font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white py-2 transition-colors duration-300" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#tech" className="text-base font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white py-2 transition-colors duration-300" onClick={() => setMobileMenuOpen(false)}>Technology</a>
            <a href="#security" className="text-base font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white py-2 transition-colors duration-300" onClick={() => setMobileMenuOpen(false)}>Security</a>
            <hr className="border-zinc-200 dark:border-zinc-800 my-2" />
            <Link to="/app" className="text-base font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white py-2 transition-colors duration-300" onClick={() => setMobileMenuOpen(false)}>
              Sign In
            </Link>
            <Link to="/signup" className="text-base font-medium text-center py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors duration-300" onClick={() => setMobileMenuOpen(false)}>
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
