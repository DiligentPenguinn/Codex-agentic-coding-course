type EmptyStateProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function EmptyState({ eyebrow, title, description }: EmptyStateProps) {
  return (
    <section className="empty-state" aria-labelledby="empty-state-title">
      <p className="eyebrow">{eyebrow}</p>
      <h1 id="empty-state-title">{title}</h1>
      <p>{description}</p>
      <span className="empty-rule" aria-hidden="true" />
    </section>
  );
}
