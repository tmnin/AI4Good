import { useState } from 'react';
import { ThemeProvider } from './context/theme-context';
import { Sidebar } from './components/sidebar';
import { DashboardScreen } from './components/dashboard-screen';
import { ScenarioScreen } from './components/scenario-screen';
import { HelpModal } from './components/help-modal';

export default function App() {
  const [activeSection, setActiveSection] = useState<string>('home');
  const [showHelp, setShowHelp] = useState(false);

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
  };

  return (
    <ThemeProvider>
      <div className="size-full flex bg-gray-50 dark:bg-gray-950">
        {/* Sidebar */}
        <Sidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          onHelp={() => setShowHelp(true)}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Content Area */}
          {activeSection === 'home' && (
            <DashboardScreen onNavigate={setActiveSection} />
          )}

          {activeSection === 'practice' && <ScenarioScreen type="practice" />}
          {activeSection === 'emergency' && <ScenarioScreen type="emergency" />}
          {activeSection === 'speak' && <ScenarioScreen type="speak" />}
        </div>

        {/* Help Modal */}
        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      </div>
    </ThemeProvider>
  );
}