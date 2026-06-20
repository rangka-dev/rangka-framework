import { icons, type LucideProps } from 'lucide-react';

export interface IconProps extends Omit<LucideProps, 'ref'> {
  name: string;
}

export function Icon({ name, size = 14, ...props }: IconProps) {
  const pascalName = name
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');

  const LucideIcon = icons[pascalName as keyof typeof icons];
  if (!LucideIcon) return null;

  return <LucideIcon size={size} {...props} />;
}
