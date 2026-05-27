type EmptyStateProps = {
  icon?: string;
  title: string;
  description?: string;
};

export default function EmptyState({ icon = '📭', title, description }: EmptyStateProps) {
  return (
    <div className="emptyState card">
      <div className="emptyStateIcon" aria-hidden="true">
        {icon}
      </div>
      <h3 className="emptyStateTitle">{title}</h3>
      {description ? <p className="emptyStateDescription">{description}</p> : null}
    </div>
  );
}
