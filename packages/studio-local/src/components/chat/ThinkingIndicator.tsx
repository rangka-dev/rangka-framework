import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { TextShimmer } from './TextShimmer';

const funnyTexts = [
  'Consulting the ancient scrolls...',
  'Asking the rubber duck...',
  'Summoning brain cells...',
  'Brewing coffee for neurons...',
  'Negotiating with the compiler...',
  'Counting semicolons...',
  'Reticulating splines...',
  'Deploying carrier pigeons...',
  'Warming up the hamster wheel...',
  'Polishing the algorithms...',
  'Bribing the CPU...',
  'Untangling spaghetti code...',
  'Feeding the code monkeys...',
  'Rolling for initiative...',
];

export function ThinkingIndicator() {
  const [text, setText] = useState(() => funnyTexts[Math.floor(Math.random() * funnyTexts.length)]);

  useEffect(() => {
    const interval = setInterval(() => {
      setText(funnyTexts[Math.floor(Math.random() * funnyTexts.length)]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 py-1.5 text-xs">
      <Loader2 className="size-3 animate-spin text-muted-foreground" />
      <TextShimmer>{text}</TextShimmer>
    </div>
  );
}
