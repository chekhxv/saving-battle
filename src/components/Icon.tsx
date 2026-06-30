import type { ComponentType } from 'react';
import { icons, HelpCircle, type LucideProps } from 'lucide-react';

interface IconProps extends LucideProps {
  name: string;
}

/** Рендерит иконку lucide по её имени (PascalCase). */
export default function Icon({ name, ...props }: IconProps) {
  const Cmp = (icons as Record<string, ComponentType<LucideProps>>)[name] ?? HelpCircle;
  return <Cmp {...props} />;
}
