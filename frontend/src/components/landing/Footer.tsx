import { Link } from 'react-router-dom';


export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-12 px-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <img src="/favicon.svg" alt="Slate Logo" className="w-6 h-6" />
          <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-white transition-colors duration-300">Slate</span>
        </div>
        <div className="flex gap-6 text-sm text-zinc-500 dark:text-zinc-400 transition-colors duration-300">
          <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-sm">Privacy Policy</a>
          <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-sm">Terms of Service</a>
          <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-sm">Contact</a>
          <Link to="/app" className="hover:text-zinc-900 dark:hover:text-white transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-sm">Sign In</Link>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-500 transition-colors duration-300">
          © {new Date().getFullYear()} Slate. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
