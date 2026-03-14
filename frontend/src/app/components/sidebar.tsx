import { MessageCircle, AlertCircle, Mic, HelpCircle, Home } from 'lucide-react';
import { AnimatedThemeToggler } from '@/registry/magicui/animated-theme-toggler';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onHelp: () => void;
}

export function Sidebar({ activeSection, onSectionChange, onHelp }: SidebarProps) {
  const menuItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'practice', icon: MessageCircle, label: 'Practice' },
    { id: 'emergency', icon: AlertCircle, label: 'Emergency' },
    { id: 'speak', icon: Mic, label: 'Speak' },
  ];

  return (
    <div className="w-20 h-svh sticky top-0 shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col items-center py-6 gap-4 overflow-y-auto">
      {/* Logo */}
      <div className="w-14 h-14 bg-gradient-to-br from-yellow-200 via-amber-200 to-yellow-100 rounded-2xl flex items-center justify-center mb-4 shadow-lg ring-1 ring-yellow-200">
        <div className="text-yellow-800 text-sm font-bold tracking-wide">Kotha</div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 flex flex-col gap-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${
                isActive
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 shadow-sm'
                  : 'text-gray-400 dark:text-gray-500 hover:text-yellow-700 dark:hover:text-yellow-300 hover:bg-yellow-50/70 dark:hover:bg-gray-800'
              }`}
              title={item.label}
            >
              <Icon className="w-6 h-6" />
            </button>
          );
        })}
      </div>

      {/* Dark Mode Toggle */}
      <AnimatedThemeToggler />

      {/* Help Button */}
      <button
        onClick={onHelp}
        className="w-14 h-14 rounded-xl flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-yellow-700 dark:hover:text-yellow-300 hover:bg-yellow-50/70 dark:hover:bg-gray-800 transition-all"
        title="Help"
      >
        <HelpCircle className="w-6 h-6" />
      </button>
    </div>
  );
}
