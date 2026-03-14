import { MessageCircle, AlertCircle, Mic, HelpCircle, Home, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/theme-context';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onHelp: () => void;
}

export function Sidebar({ activeSection, onSectionChange, onHelp }: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
  
  const menuItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'practice', icon: MessageCircle, label: 'Practice' },
    { id: 'emergency', icon: AlertCircle, label: 'Emergency' },
    { id: 'speak', icon: Mic, label: 'Speak' },
  ];

  return (
    <div className="w-20 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col items-center py-6 gap-4">
      {/* Logo */}
      <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
        <div className="text-white text-2xl font-bold">K</div>
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
                  ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              title={item.label}
            >
              <Icon className="w-6 h-6" />
            </button>
          );
        })}
      </div>

      {/* Dark Mode Toggle */}
      <button
        onClick={toggleTheme}
        className="w-14 h-14 rounded-xl flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-800 transition-all"
        title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
      >
        {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
      </button>

      {/* Help Button */}
      <button
        onClick={onHelp}
        className="w-14 h-14 rounded-xl flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-800 transition-all"
        title="Help"
      >
        <HelpCircle className="w-6 h-6" />
      </button>
    </div>
  );
}