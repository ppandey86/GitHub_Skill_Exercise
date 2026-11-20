import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = {
  type: string;
  minutes: number;
  points: number;
};

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ activities: Activity[] }>('/api/activities')
      .then(({ activities: result }) => {
        if (active) setActivities(result);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unknown error');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Activities</h2>
        <p>Track student activity minutes and points.</p>
        {loading && <p role="status">Loading activities...</p>}
        {error && <p role="alert">Unable to load activities: {error}</p>}
        {!loading && !error && activities.length === 0 && <p>No activities yet.</p>}
        {!loading && !error && activities.length > 0 && (
          <ul className="list-group">
            {activities.map((activity, index) => (
              <li className="list-group-item" key={`${activity.type}-${activity.minutes}-${index}`}>
                <strong>{activity.type}</strong>: {activity.minutes} minutes, {activity.points} points
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
