import { Sparkles, ShoppingCart, Users, ClipboardList } from 'lucide-react';

const SUGGESTED_PROMPTS = [
  {
    icon: ShoppingCart,
    label: 'E-commerce app',
    prompt: 'Build an e-commerce app with products, orders, and customers',
  },
  {
    icon: Users,
    label: 'CRM system',
    prompt: 'Create a CRM with contacts, deals, and activity tracking',
  },
  {
    icon: ClipboardList,
    label: 'Project tracker',
    prompt: 'Build a project management app with tasks, teams, and timelines',
  },
];

interface EmptyChatStateProps {
  onSelectPrompt: (prompt: string) => void;
}

export function EmptyChatState({ onSelectPrompt }: EmptyChatStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6">
      <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 mb-4">
        <Sparkles className="size-5 text-primary" />
      </div>
      <h3 className="text-sm font-medium">What would you like to build?</h3>
      <p className="mt-1 text-center text-xs text-muted-foreground max-w-[260px]">
        Describe your app in natural language. I can create models, pages, services, and more.
      </p>
      <div className="mt-6 w-full max-w-[280px] space-y-2">
        {SUGGESTED_PROMPTS.map((item) => (
          <button
            key={item.label}
            onClick={() => onSelectPrompt(item.prompt)}
            className="flex w-full items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
          >
            <item.icon className="size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium">{item.label}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">{item.prompt}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
