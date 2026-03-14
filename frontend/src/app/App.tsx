import { useState } from "react";
import { ThemeProvider } from "./context/theme-context";
import { Sidebar } from "./components/sidebar";
import { ScenarioScreen } from "./components/scenario-screen";

export default function App() {
  const [activeSection, setActiveSection] = useState<string>("practice");

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
  };

  const handleHelpAudio = () => {
    const audio = new Audio(
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjGJ0fPTgjMGHm7A7+OZURE="
    );
    audio.volume = 0.5;
    audio.play();
  };

  return (
    <ThemeProvider>
      <div className="size-full flex h-svh bg-gray-50 dark:bg-gray-950 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          onHelp={handleHelpAudio}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Content Area */}
          {activeSection === "practice" && <ScenarioScreen type="practice" />}
          {activeSection === "emergency" && <ScenarioScreen type="emergency" />}
          {activeSection === "speak" && <ScenarioScreen type="speak" />}
        </div>
      </div>
    </ThemeProvider>
  );
}
