export default function StatsSection() {
  return (
    <section id="security" className="px-6 py-16 max-w-5xl mx-auto border-t border-zinc-200 dark:border-zinc-800/50 transition-colors duration-300">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-zinc-200 dark:divide-zinc-800 transition-colors duration-300">
        <div className="py-4">
          <div className="text-4xl font-extrabold text-zinc-900 dark:text-white mb-2 transition-colors duration-300">&lt; 30ms</div>
          <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider transition-colors duration-300">Message Latency</div>
        </div>
        <div className="py-4">
          <div className="text-4xl font-extrabold text-zinc-900 dark:text-white mb-2 transition-colors duration-300">99.9%</div>
          <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider transition-colors duration-300">Uptime SLA</div>
        </div>
        <div className="py-4">
          <div className="text-4xl font-extrabold text-zinc-900 dark:text-white mb-2 transition-colors duration-300">256-bit</div>
          <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider transition-colors duration-300">AES Encryption</div>
        </div>
      </div>
    </section>
  );
}
