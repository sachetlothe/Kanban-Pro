export const ActivityFeed = ({ activities }) => (
  <section className="panel">
    <div className="section-head">
      <h3>Activity</h3>
    </div>
    <div className="activity-list">
      {activities.map((activity) => (
        <div key={activity._id} className="activity-item">
          <strong>{activity.user?.name}</strong>
          <span>{activity.action.replaceAll("_", " ")}</span>
          <small>{new Date(activity.createdAt).toLocaleString()}</small>
        </div>
      ))}
      {activities.length === 0 ? <p className="muted">No activity yet.</p> : null}
    </div>
  </section>
);
