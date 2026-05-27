import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <header className="pageHeader">
      <div>
        <h1 className="pageTitle">{title}</h1>
        {subtitle ? <p className="pageSubtitle">{subtitle}</p> : null}
      </div>
      {action ? <div className="pageHeaderAction">{action}</div> : null}
    </header>
  );
}
