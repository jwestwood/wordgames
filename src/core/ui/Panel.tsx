import type { HTMLAttributes, ReactNode } from 'react';

export interface PanelProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode;
  variant?: 'paper' | 'wood';
}

/** A paper card (or wooden tray) container. */
export function Panel({
  title,
  variant = 'paper',
  className = '',
  children,
  ...props
}: PanelProps) {
  return (
    <section className={`panel panel--${variant} ${className}`.trim()} {...props}>
      {title && <h3 className="panel__title">{title}</h3>}
      {children}
    </section>
  );
}
