import { useApiResource } from '../hooks/useApiResource.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = {
  teamName: string;
  totalPoints: number;
  rank: number;
};

export default function Leaderboard() {
  const { data, loading, error } = useApiResource<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard');
  const entries = data?.leaderboard ?? [];

  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      loading={loading}
      error={error}
      empty={entries.length === 0}
      emptyMessage="No leaderboard rankings yet."
    >
      <ol className="list-group list-group-numbered">
        {entries.map((entry) => (
          <li className="list-group-item" key={entry.rank}>
            {entry.teamName}: {entry.totalPoints} points
          </li>
        ))}
      </ol>
    </CapabilityCard>
  );
}
