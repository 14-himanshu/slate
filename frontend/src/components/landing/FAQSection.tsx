import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: "How does Slate compare to Slack or Discord?",
    answer: "Slate is built specifically for modern engineering teams. Instead of cluttered threads and endless notification badges, we focus on a clean, real-time sync experience that keeps discussions organized and searchable without the chaos."
  },
  {
    question: "Is my data secure?",
    answer: "Yes. All messages are encrypted in transit and at rest. We adhere to industry-standard security practices to ensure your team's intellectual property remains completely private."
  },
  {
    question: "Do you have mobile apps available?",
    answer: "Currently, Slate is optimized for desktop browsers and mobile web. Native iOS and Android applications are in active development and will be released soon."
  },
  {
    question: "Can I self-host Slate?",
    answer: "Our current offering is a fully managed cloud solution to ensure the highest reliability and real-time performance. Enterprise self-hosting options will be available later this year."
  }
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 md:py-32 px-6 max-w-4xl mx-auto border-t border-zinc-200 dark:border-zinc-800/50 transition-colors duration-300">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-4 transition-colors duration-300">
          Frequently Asked Questions
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 text-lg transition-colors duration-300">
          Everything you need to know about Slate.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div 
              key={i} 
              className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-950/50 transition-colors duration-300"
            >
              <button
                className="w-full px-6 py-6 text-left flex items-center justify-between focus:outline-none"
                onClick={() => setOpenIndex(isOpen ? null : i)}
              >
                <span className="font-semibold text-lg text-zinc-900 dark:text-white transition-colors duration-300">
                  {faq.question}
                </span>
                <ChevronDown 
                  className={`w-5 h-5 text-zinc-500 dark:text-zinc-400 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
                />
              </button>
              
              <div 
                className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-40 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed transition-colors duration-300">
                  {faq.answer}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
