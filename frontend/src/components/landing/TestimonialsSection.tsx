import { Star } from 'lucide-react';

const testimonials = [
  {
    quote: "Slate completely eliminated our team's DM chaos. We finally have a single, searchable home for all engineering discussions.",
    name: "Sarah Jenkins",
    title: "VP of Engineering at TechFlow",
    avatar: "S"
  },
  {
    quote: "The real-time sync is flawless. It feels faster than Slack, and the dark mode is gorgeous. Our developers love it.",
    name: "Marcus Chen",
    title: "Lead Developer at CloudNative",
    avatar: "M"
  },
  {
    quote: "Switching to Slate was a breeze. We set it up in minutes and haven't looked back. Highly recommended for modern teams.",
    name: "Elena Rodriguez",
    title: "CTO at StartUp Inc.",
    avatar: "E"
  }
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 md:py-32 px-6 max-w-7xl mx-auto border-t border-zinc-200 dark:border-zinc-800/50 transition-colors duration-300">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-4 transition-colors duration-300">
          Loved by engineering teams
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 text-lg max-w-2xl mx-auto transition-colors duration-300">
          Don't just take our word for it. See what leaders are saying about Slate.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {testimonials.map((t, i) => (
          <div key={i} className="p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 transition-colors duration-300 flex flex-col justify-between">
            <div>
              <div className="flex gap-1 mb-6">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className="w-5 h-5 fill-indigo-500 text-indigo-500" />
                ))}
              </div>
              <p className="text-zinc-700 dark:text-zinc-300 text-lg leading-relaxed mb-8 transition-colors duration-300">
                "{t.quote}"
              </p>
            </div>
            <div className="flex items-center gap-4 mt-auto">
              <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                {t.avatar}
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-white transition-colors duration-300">{t.name}</h4>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 transition-colors duration-300">{t.title}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
