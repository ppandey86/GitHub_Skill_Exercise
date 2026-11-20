import { useCallback } from 'react';
import { getJson } from '../api/client.js';
import { useApiResource } from '../hooks/useApiResource.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = {
  type: string;
  minutes: number;
  points: number;
};

export default function Activities() {
  const loadActivities = useCallback(() => getJson<{ activities: Activity[] }>('/api/activities'), []);
  const { data, loading, error } = useApiResource(loadActivities);
  const activities = data?.activities ?? [];

  return (
    <CapabilityCard
      title="Activities"
      description="Track student activity minutes and points."
      loading={loading}
      error={error}
      empty={activities.length === 0}
      emptyMessage="No activities yet."
    >
      <ul className="list-group">
        {activities.map((activity, index) => (
          <li className="list-group-item" key={`${activity.type}-${activity.minutes}-${index}`}>
            <strong>{activity.type}</strong>: {activity.minutes} minutes, {activity.points} points
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
