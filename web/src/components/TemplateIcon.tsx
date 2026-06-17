import {
  BookOpen,
  Bug,
  ChartBar,
  CircleCheck,
  FileText,
  MessageCircle,
  Network,
  Puzzle,
  Star,
  Target,
  type LucideIcon,
} from 'lucide-react';
import type { TemplateIconName } from '../lib/templates';

const icons: Record<TemplateIconName, LucideIcon> = {
  'book-open': BookOpen,
  bug: Bug,
  'chart-bar': ChartBar,
  'circle-check': CircleCheck,
  'file-text': FileText,
  'message-circle': MessageCircle,
  network: Network,
  puzzle: Puzzle,
  star: Star,
  target: Target,
};

type TemplateIconProps = {
  name: TemplateIconName;
};

export function TemplateIcon({ name }: TemplateIconProps) {
  const Icon = icons[name];
  return <Icon size={18} strokeWidth={2} aria-hidden="true" />;
}
