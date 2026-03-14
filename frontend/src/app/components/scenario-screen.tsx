import { useState, useEffect } from "react";
import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  Briefcase,
  Bus,
  ClipboardList,
  GraduationCap,
  Home,
  Hospital,
  Landmark,
  Layers,
  MessageCircle,
  Mic,
  Pill,
  ShoppingCart,
  Utensils,
  Volume2,
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import scenariosData from "../../data/scenarios.json";

interface ScenarioScreenProps {
  type: "practice" | "emergency" | "speak";
}

export function ScenarioScreen({ type }: ScenarioScreenProps) {
  const [selectedScenario, setSelectedScenario] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const scenarios = scenariosData[type];
  const scenarioIcons: Record<string, LucideIcon> = {
    Bus,
    Hospital,
    Pill,
    ShoppingCart,
    Briefcase,
    Home,
    GraduationCap,
    Banknote,
    Landmark,
    Utensils,
    AlertTriangle,
    MessageCircle,
  };
  const selectedScenarioIcon = selectedScenario
    ? scenarioIcons[selectedScenario.icon] ?? MessageCircle
    : MessageCircle;
  const SelectedScenarioIcon = selectedScenarioIcon;
  const selectedIndex = selectedScenario
    ? scenarios.findIndex((scenario) => scenario.id === selectedScenario.id)
    : -1;

  // Auto-select first scenario for emergency and speak modes
  useEffect(() => {
    if ((type === "emergency" || type === "speak") && scenarios.length > 0) {
      setSelectedScenario(scenarios[0]);
    }
  }, [type, scenarios]);

  useEffect(() => {
    if (selectedScenario) {
      setIsReady(false);
      const readyTimeout = setTimeout(() => {
        setIsReady(true);
        playBeepSound();
      }, 1500);

      return () => clearTimeout(readyTimeout);
    }
  }, [selectedScenario]);

  const playBeepSound = () => {
    const audio = new Audio();
    audio.src =
      "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
    audio.volume = 0.5;
    audio.play();
  };

  const handleMicClick = () => {
    if (!isReady) return;
    setIsListening(!isListening);
    playBeepSound();
  };

  const handleScenarioStep = (direction: "prev" | "next") => {
    if (!selectedScenario || scenarios.length === 0) return;
    const delta = direction === "next" ? 1 : -1;
    const nextIndex =
      (selectedIndex + delta + scenarios.length) % scenarios.length;
    setSelectedScenario(scenarios[nextIndex]);
    setIsListening(false);
    setIsReady(false);
  };

  // If no scenario selected, show grid of scenario options
  if (!selectedScenario) {
    return (
      <div className="flex-1 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-gray-900 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {type === "practice" && (
              <span className="inline-flex items-center gap-3">
                <MessageCircle className="w-10 h-10" />
                <span>Practice Conversations</span>
              </span>
            )}
            {type === "emergency" && (
              <span className="inline-flex items-center gap-3">
                <AlertTriangle className="w-10 h-10" />
                <span>Emergency Phrases</span>
              </span>
            )}
            {type === "speak" && (
              <span className="inline-flex items-center gap-3">
                <Mic className="w-10 h-10" />
                <span>Free Speaking</span>
              </span>
            )}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Choose a scenario to practice
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scenarios.map((scenario) => {
              const ScenarioIcon =
                scenarioIcons[scenario.icon] ?? MessageCircle;
              return (
                <button
                  key={scenario.id}
                  onClick={() => setSelectedScenario(scenario)}
                  className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 text-left"
                >
                  <div className="relative h-48 overflow-hidden">
                    <ImageWithFallback
                      src={scenario.image}
                      alt={scenario.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <div className="mb-2">
                        <ScenarioIcon className="w-10 h-10" />
                      </div>
                      <div className="text-2xl font-bold">{scenario.title}</div>
                    </div>
                  </div>
                  {/* <div className="p-6">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {scenario.description}
                  </p>
                  <div className="space-y-2">
                    {scenario.situations
                      .slice(0, 3)
                      .map((situation: string, idx: number) => (
                        <div
                          key={idx}
                          className="text-sm text-gray-500 dark:text-gray-400 flex items-start gap-2"
                        >
                          <span className="text-indigo-500 dark:text-indigo-400">
                            •
                          </span>
                          <span>{situation}</span>
                        </div>
                      ))}
                    {scenario.situations.length > 3 && (
                      <div className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                        +{scenario.situations.length - 3} more...
                      </div>
                    )}
                  </div>
                </div> */}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Show selected scenario detail
  return (
    <div className="flex-1 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-gray-900 p-8 overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Back Button - Only show for practice scenarios */}
        {type === "practice" && (
          <button
            onClick={() => {
              setSelectedScenario(null);
              setIsListening(false);
              setIsReady(false);
            }}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-lg font-medium">Back to scenarios</span>
          </button>
        )}

        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
          <SelectedScenarioIcon className="w-10 h-10" />
          <span>{selectedScenario.title}</span>
        </h1>
        {/* <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          {selectedScenario.description}
        </p> */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Scenario {selectedIndex + 1} of {scenarios.length}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleScenarioStep("prev")}
              className="w-12 h-12 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
              title="Previous scenario"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleScenarioStep("next")}
              className="w-12 h-12 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
              title="Next scenario"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Full Width Image Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden mb-8">
          {/* Image Section */}
          <div className="relative aspect-video bg-gray-100 dark:bg-gray-700">
            <ImageWithFallback
              src={selectedScenario.image}
              alt={selectedScenario.title}
              className="w-full h-full object-cover"
            />

            {/* Overlay Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
              {/* Microphone Button with Pulsing */}
              <div className="relative">
                {isReady && !isListening && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-indigo-400/30"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.6, 0, 0.6],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}

                <motion.button
                  onClick={handleMicClick}
                  className={`relative z-10 w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-all ${
                    isListening
                      ? "bg-red-500 hover:bg-red-600"
                      : isReady
                      ? "bg-indigo-600 hover:bg-indigo-700"
                      : "bg-gray-400"
                  }`}
                  whileTap={{ scale: 0.9 }}
                >
                  <Mic className="w-7 h-7 text-white" />
                </motion.button>
              </div>

              <button className="w-16 h-16 rounded-full bg-gray-800/80 hover:bg-gray-900 flex items-center justify-center transition-colors">
                <Volume2 className="w-7 h-7 text-white" />
              </button>
            </div>
          </div>

          {/* Waveform Visualization */}
          {isListening && (
            <div className="flex items-center justify-center gap-1 py-6 px-8 bg-gray-50 dark:bg-gray-900">
              {[...Array(60)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-indigo-500 dark:bg-indigo-400 rounded-full"
                  animate={{
                    height: ["8px", "48px", "8px"],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.03,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Situations Card */}
          {/* <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                <span className="inline-flex items-center gap-2">
                  <ClipboardList className="w-6 h-6" />
                  <span>What You'll Learn</span>
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedScenario.situations.map(
                  (situation: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700"
                    >
                      <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                          {index + 1}
                        </span>
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">
                        {situation}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div> */}

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Phrases Card */}
            {/* <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Key Phrases</h3>
              <div className="space-y-3">
                {selectedScenario.phrases.map((phrase: any, index: number) => (
                  <button
                    key={index}
                    onClick={handlePlayAudio}
                    className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-left transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="text-gray-900 dark:text-white font-semibold">{phrase.rohingya}</span>
                      <Volume2 className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex-shrink-0 mt-1" />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{phrase.english}</span>
                  </button>
                ))}
              </div>
            </div> */}

            {/* Status Card */}
            {/* <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-sm font-medium">
                  {isListening
                    ? "Listening..."
                    : isReady
                    ? "Ready to speak"
                    : "Getting ready..."}
                </span>
              </div>
              <p className="text-sm opacity-90">
                {isReady &&
                  !isListening &&
                  "Tap the microphone when you hear the beep"}
                {isListening && "Speak clearly and naturally"}
                {!isReady && "Preparing your lesson..."}
              </p>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}
