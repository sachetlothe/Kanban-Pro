export const MetricsBar = ({ metrics }) => (
  <section className="metrics-grid">
    <article className="metric-card panel">
      <span>Progress</span>
      <strong>{metrics?.progress || 0}%</strong>
    </article>
    <article className="metric-card panel">
      <span>Total cards</span>
      <strong>{metrics?.totalCards || 0}</strong>
    </article>
    <article className="metric-card panel">
      <span>Completed</span>
      <strong>{metrics?.completedCards || 0}</strong>
    </article>
    <article className="metric-card panel">
      <span>Overdue</span>
      <strong>{metrics?.overdueCards || 0}</strong>
    </article>
    <article className="metric-card panel">
      <span>Backlog items</span>
      <strong>{metrics?.backlogCards || 0}</strong>
    </article>
    <article className="metric-card panel">
      <span>In sprint</span>
      <strong>{metrics?.activeSprintCards || 0}</strong>
    </article>
  </section>
);
