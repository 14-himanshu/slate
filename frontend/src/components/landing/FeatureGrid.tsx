import { Zap, Database, Cloud, Lock, Users, Smartphone, Server, Layout } from 'lucide-react';
import { useEffect, useRef } from 'react';

const features = [
  {
    title: 'Live Presence & Typing',
    description: 'Know exactly who is online and when they are actively composing a message with sub-50ms latency globally.',
    icon: Zap,
    colorClass: 'text-indigo-400',
    bgClass: 'bg-indigo-500/10',
  },
  {
    title: 'Instant Sync & History',
    description: 'Switch between hundreds of rooms instantly. Messages are paginated and cached flawlessly via MongoDB.',
    icon: Database,
    colorClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/10',
  },
  {
    title: 'Secure Media Sharing',
    description: 'Authenticated Cloudinary integration handles massive file uploads, rich media previews, and image optimization.',
    icon: Cloud,
    colorClass: 'text-cyan-400',
    bgClass: 'bg-cyan-500/10',
  },
  {
    title: 'Zero-Trust Security',
    description: 'Built from the ground up for the enterprise. We utilize Bcrypt hashing, strict JWT handshakes, and CORS policies.',
    icon: Lock,
    colorClass: 'text-rose-400',
    bgClass: 'bg-rose-500/10',
    id: 'security'
  },
  {
    title: 'Threaded Context',
    description: 'Keep conversations organized with deep message threads, inline replies, and native draft saving per room.',
    icon: Users,
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-500/10',
  },
  {
    title: 'Responsive Design',
    description: 'A flawless experience across all devices. The chat interface adapts perfectly from desktop to mobile screens.',
    icon: Smartphone,
    colorClass: 'text-purple-400',
    bgClass: 'bg-purple-500/10',
  },
];

export default function FeatureGrid() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in', 'fade-in', 'slide-in-from-bottom-8');
            entry.target.classList.remove('opacity-0');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const cards = sectionRef.current?.querySelectorAll('.feature-card');
    cards?.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* ─── Tech Stack ─── */}
      <section id="tech" className="py-16 border-y border-zinc-200 dark:border-zinc-800/50 bg-zinc-50 dark:bg-zinc-900/20">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-8">Powered By Modern Technology</p>
          <div className="flex flex-wrap justify-center gap-12 text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-2 font-medium text-lg"><Server className="w-6 h-6" aria-hidden="true" /> Node.js</div>
            <div className="flex items-center gap-2 font-medium text-lg"><Zap className="w-6 h-6" aria-hidden="true" /> WebSockets</div>
            <div className="flex items-center gap-2 font-medium text-lg"><Database className="w-6 h-6" aria-hidden="true" /> MongoDB</div>
            <div className="flex items-center gap-2 font-medium text-lg"><Layout className="w-6 h-6" aria-hidden="true" /> React 19</div>
            <div className="flex items-center gap-2 font-medium text-lg"><Cloud className="w-6 h-6" aria-hidden="true" /> Cloudinary</div>
          </div>
        </div>
      </section>

      {/* ─── Features Grid ─── */}
      <section id="features" ref={sectionRef} className="py-24 md:py-32 px-6 max-w-7xl mx-auto overflow-hidden">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-4">Everything you need to scale</h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg max-w-2xl mx-auto">A hyper-focused feature set designed to deliver the best messaging experience without the enterprise bloat.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div 
              key={feature.title} 
              id={feature.id}
              className="feature-card opacity-0 duration-700 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-8 rounded-2xl hover:border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800/50 transition-all"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-6 ${feature.bgClass} ${feature.colorClass}`}>
                <feature.icon className="w-6 h-6" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-3">{feature.title}</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
