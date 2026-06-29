import type { WidgetComponentProps } from '../types';

export function FormWidget({ children }: WidgetComponentProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <form data-slot="widget-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
      {children}
    </form>
  );
}

FormWidget.displayName = 'FormWidget';
