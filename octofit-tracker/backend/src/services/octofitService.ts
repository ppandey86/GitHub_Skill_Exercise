import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

const objectIdPattern = /^[\da-f]{24}$/i;

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw httpError(400, 'Activity details are required');

  const { userId, teamId, type, minutes } = input;
  if (typeof userId !== 'string' || !objectIdPattern.test(userId)) {
    throw httpError(400, 'A valid userId is required');
  }
  if (typeof teamId !== 'string' || !objectIdPattern.test(teamId)) {
    throw httpError(400, 'A valid teamId is required');
  }
  if (typeof type !== 'string' || type.trim().length === 0) {
    throw httpError(400, 'A valid activity type is required');
  }
  if (typeof minutes !== 'number' || !Number.isInteger(minutes) || minutes < 1) {
    throw httpError(400, 'Minutes must be a positive whole number');
  }

  const [user, team] = await Promise.all([
    User.findById(userId).select('_id'),
    Team.findById(teamId).select('_id'),
  ]);
  if (!user || !team) throw httpError(404, 'The specified user or team was not found');

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw httpError(400, 'Team details are required');

  const { name, mascot, members } = input;
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw httpError(400, 'A team name is required');
  }
  if (typeof mascot !== 'string' || mascot.trim().length === 0) {
    throw httpError(400, 'A team mascot is required');
  }
  if (members !== undefined && !Array.isArray(members)) {
    throw httpError(400, 'Team members must be an array of user IDs');
  }

  const memberIds = members === undefined
    ? []
    : members.filter((member): member is string => typeof member === 'string' && objectIdPattern.test(member));
  if (members !== undefined && memberIds.length !== members.length) {
    throw httpError(400, 'Team members must be valid user IDs');
  }

  const uniqueMemberIds = [...new Set(memberIds)];
  const existingMembers = await User.find({ _id: { $in: uniqueMemberIds } }).select('_id').lean();
  if (existingMembers.length !== uniqueMemberIds.length) {
    throw httpError(404, 'One or more team members were not found');
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
}

export async function getLeaderboard() {
  const [teams, pointTotals] = await Promise.all([
    Team.find().select('name').lean(),
    Activity.aggregate<{ _id: Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const totalsByTeam = new Map(pointTotals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  return teams
    .map(({ _id, name }) => ({
      teamName: name,
      totalPoints: totalsByTeam.get(_id.toString()) ?? 0,
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail });
  if (!user) throw httpError(404, 'User was not found');

  const [recentActivity, workouts] = await Promise.all([
    Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean(),
    Workout.find().lean(),
  ]);
  const activityFocusByType: Record<string, string> = {
    run: 'endurance',
    cycle: 'endurance',
    strength: 'strength',
    walk: 'mobility',
  };
  const goal = user.fitnessGoal.trim().toLowerCase();
  const recentFocus = recentActivity
    ? activityFocusByType[recentActivity.type.trim().toLowerCase()] ?? recentActivity.type.trim().toLowerCase()
    : undefined;
  const relevantWorkouts = workouts
    .filter((workout) => {
      const focus = workout.focus.trim().toLowerCase();
      return focus === goal || (recentFocus !== undefined && focus === recentFocus);
    })
    .sort((left, right) => {
      const leftMatchesGoal = left.focus.trim().toLowerCase() === goal;
      const rightMatchesGoal = right.focus.trim().toLowerCase() === goal;
      return Number(rightMatchesGoal) - Number(leftMatchesGoal);
    });

  return relevantWorkouts.map((workout) => {
    const matchesGoal = workout.focus.trim().toLowerCase() === goal;
    const reason = matchesGoal
      ? `Matches your ${user.fitnessGoal} fitness goal`
      : `Matches your recent ${recentActivity?.type} activity`;
    return { ...workout, reason };
  });
}

export { User };
