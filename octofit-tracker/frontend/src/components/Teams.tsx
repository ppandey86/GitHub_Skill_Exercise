import { useCallback } from 'react';
import { getJson } from '../api/client.js';
import { useApiResource } from '../hooks/useApiResource.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = {
  name: string;
  mascot?: string;
  members?: string[];
};

export default function Teams() {
  const loadTeams = useCallback(() => getJson<{ teams: Team[] }>('/api/teams'), []);
  const { data, loading, error } = useApiResource(loadTeams);
  const teams = data?.teams ?? [];

  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      loading={loading}
      error={error}
      empty={teams.length === 0}
      emptyMessage="No teams yet."
    >
      <ul className="list-group">
        {teams.map((team) => (
          <li className="list-group-item" key={team.name}>
            <strong>{team.name}</strong>
            {team.mascot && <span> — {team.mascot}</span>}
            <div>Members: {team.members?.join(', ') || 'None'}</div>
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
