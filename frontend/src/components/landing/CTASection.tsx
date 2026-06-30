import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function CTASection() {
  return (
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-5xl mx-auto rounded-3xl overflow-hidden relative">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-indigo-600 dark:bg-indigo-900 transition-colors duration-300" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent" />
        
        <div className="relative px-6 py-20 md:py-24 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Ready to upgrade your team's communication?
          </h2>
          <p className="text-indigo-100 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Join thousands of modern engineering teams who have already ditched the DM chaos for Slate.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/signup" 
              className="w-full sm:w-auto px-8 py-4 bg-white text-indigo-600 font-bold rounded-full hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300 shadow-xl"
            >
              Get Started for Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a 
              href="#how-it-works" 
              className="w-full sm:w-auto px-8 py-4 bg-transparent text-white font-medium rounded-full hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
            >
              See how it works
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
