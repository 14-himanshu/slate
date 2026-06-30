import { UserPlus, MessageSquareText, Layers } from 'lucide-react';

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 md:py-32 px-6 max-w-7xl mx-auto border-t border-zinc-200 dark:border-zinc-800/50 transition-colors duration-300">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-4 transition-colors duration-300">From zero to syncing in minutes</h2>
        <p className="text-zinc-600 dark:text-zinc-400 text-lg max-w-2xl mx-auto transition-colors duration-300">Skip the complicated onboarding. Get your team communicating instantly with our streamlined setup process.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
        {/* Connecting Line — visible in both themes */}
        <div className="hidden md:block absolute top-12 left-24 right-24 h-[2px] bg-gradient-to-r from-zinc-200 dark:from-zinc-800 via-indigo-500/40 to-zinc-200 dark:to-zinc-800 transition-colors duration-300" />
        
        {/* Step 1 */}
        <div className="relative flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-white dark:bg-zinc-900 border-4 border-zinc-50 dark:border-zinc-950 shadow-[0_0_0_2px_theme(colors.zinc.200)] dark:shadow-[0_0_0_2px_#3f3f46] flex items-center justify-center text-indigo-500 dark:text-indigo-400 mb-6 z-10 transition-colors duration-300">
            <Layers className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3 transition-colors duration-300">1. Create a workspace</h3>
          <p className="text-zinc-600 dark:text-zinc-400 transition-colors duration-300">Set up your team's home base in seconds. Configure channels and permissions effortlessly.</p>
        </div>

        {/* Step 2 */}
        <div className="relative flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-white dark:bg-zinc-900 border-4 border-zinc-50 dark:border-zinc-950 shadow-[0_0_0_2px_theme(colors.zinc.200)] dark:shadow-[0_0_0_2px_#3f3f46] flex items-center justify-center text-emerald-500 dark:text-emerald-400 mb-6 z-10 transition-colors duration-300">
            <UserPlus className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3 transition-colors duration-300">2. Invite your team</h3>
          <p className="text-zinc-600 dark:text-zinc-400 transition-colors duration-300">Send a simple invite link. Your colleagues can join and authenticate securely in one click.</p>
        </div>

        {/* Step 3 */}
        <div className="relative flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-white dark:bg-zinc-900 border-4 border-zinc-50 dark:border-zinc-950 shadow-[0_0_0_2px_theme(colors.zinc.200)] dark:shadow-[0_0_0_2px_#3f3f46] flex items-center justify-center text-cyan-500 dark:text-cyan-400 mb-6 z-10 transition-colors duration-300">
            <MessageSquareText className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3 transition-colors duration-300">3. Start communicating</h3>
          <p className="text-zinc-600 dark:text-zinc-400 transition-colors duration-300">Jump into real-time channels or start a 1:1 direct message. All history is synced globally.</p>
        </div>
      </div>
    </section>
  );
}
