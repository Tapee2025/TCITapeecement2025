import AchievementSystem from '../../components/gamification/AchievementSystem';

export default function Achievements() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Achievements</h1>
        <p className="text-gray-600">Track your progress and unlock rewards</p>
      </div>

      <AchievementSystem />
    </div>
  );
}