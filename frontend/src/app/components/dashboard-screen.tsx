import { ImageWithFallback } from './figma/ImageWithFallback';
import { TrendingUp, Award, Clock, Target } from 'lucide-react';

interface DashboardScreenProps {
  onNavigate: (section: string) => void;
}

export function DashboardScreen({ onNavigate }: DashboardScreenProps) {
  const stats = [
    { label: 'Lessons Completed', value: '12', icon: Award, color: 'from-blue-500 to-cyan-500' },
    { label: 'Practice Time', value: '4.5h', icon: Clock, color: 'from-purple-500 to-pink-500' },
    { label: 'Words Learned', value: '248', icon: Target, color: 'from-orange-500 to-red-500' },
    { label: 'Streak Days', value: '7', icon: TrendingUp, color: 'from-green-500 to-emerald-500' },
  ];

  const quickActions = [
    {
      id: 'practice',
      title: 'Practice Conversations',
      description: 'Learn common phrases and greetings',
      image: 'https://images.unsplash.com/photo-1658270660328-2e9f47248370?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0d28lMjBwZW9wbGUlMjB0YWxraW5nJTIwY29udmVyc2F0aW9ufGVufDF8fHx8MTc3MzQ5ODI4NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      emoji: '💬',
    },
    {
      id: 'emergency',
      title: 'Emergency Phrases',
      description: 'Essential phrases for urgent situations',
      image: 'https://images.unsplash.com/photo-1771310959284-6c011ab8e725?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbWVyZ2VuY3klMjBhbGVydCUyMHVyZ2VudHxlbnwxfHx8fDE3NzM0OTgyODZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      emoji: '🚨',
    },
    {
      id: 'speak',
      title: 'Free Speaking',
      description: 'Practice speaking freely in Rohingya',
      image: 'https://images.unsplash.com/photo-1773243906496-4a1ff77984b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaWNyb3Bob25lJTIwc3BlYWtpbmclMjB2b2ljZXxlbnwxfHx8fDE3NzM0OTgyODd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      emoji: '🎤',
    },
  ];

  return (
    <div className="flex-1 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-gray-900 p-8 overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-2">Welcome back! 👋</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">Ready to continue your Rohingya learning journey?</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">🎯 Quick Start</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => onNavigate(action.id)}
                className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <div className="relative h-48 overflow-hidden">
                  <ImageWithFallback
                    src={action.image}
                    alt={action.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <div className="text-3xl mb-2">{action.emoji}</div>
                    <div className="text-xl font-bold">{action.title}</div>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 dark:text-gray-400 text-left">{action.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">📈 Recent Activity</h2>
          <div className="space-y-4">
            {[
              { title: 'Completed "Basic Greetings"', time: '2 hours ago', progress: 100 },
              { title: 'Practiced Shopping Phrases', time: '1 day ago', progress: 75 },
              { title: 'Emergency Phrases Review', time: '2 days ago', progress: 100 },
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-white">{activity.title}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{activity.time}</div>
                </div>
                <div className="text-2xl">
                  {activity.progress === 100 ? '✅' : '⏳'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}