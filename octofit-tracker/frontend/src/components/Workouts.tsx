import { useApiResource } from '../hooks/useApiResource.js';
import { CapabilityCard } from './CapabilityCard.js';

type Workout = {
  title: string;
  focus?: string;
  minutes?: number;
  difficulty?: string;
  reason?: string;
};

const userEmail = 'mona@example.com';

export default function Workouts() {
  const path = `/api/workouts/suggestions/${encodeURIComponent(userEmail)}`;
  const { data, loading, error } = useApiResource<{ suggestions: Workout[] }>(path);
  const suggestions = data?.suggestions ?? [];

  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      loading={loading}
      error={error}
      empty={suggestions.length === 0}
      emptyMessage="No workout suggestions available."
    >
      <ul className="list-group">
        {suggestions.map((workout) => (
          <li className="list-group-item" key={workout.title}>
            <strong>{workout.title}</strong>
            {workout.focus && <span> — {workout.focus}</span>}
            {workout.minutes !== undefined && <span>, {workout.minutes} minutes</span>}
            {workout.difficulty && <span>, {workout.difficulty}</span>}
            {workout.reason && <div>{workout.reason}</div>}
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
