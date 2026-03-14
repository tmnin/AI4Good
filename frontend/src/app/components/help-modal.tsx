import { useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  Info,
  MessageCircle,
  Mic,
  Volume2,
  X,
} from "lucide-react";
import { motion } from "motion/react";

interface HelpModalProps {
  onClose: () => void;
}

export function HelpModal({ onClose }: HelpModalProps) {
  useEffect(() => {
    // Play help audio in Rohingya when modal opens
    const audio = new Audio();
    // This would be actual Rohingya audio explaining the app
    audio.src =
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjGJ0fPTgjMGHm7A7+OZURE=";
    audio.volume = 0.5;
    audio.play();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        </button>

        <h2 className="text-4xl font-bold text-center text-indigo-900 dark:text-indigo-300 mb-8">
          <span className="inline-flex items-center justify-center gap-3">
            <Info className="w-8 h-8" />
            <span>How to Use Kotha AI</span>
          </span>
        </h2>

        {/* Visual Guide */}
        <div className="space-y-6">
          <div className="flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-300">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-1">
                Practice
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Learn common phrases and everyday conversations
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-300">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-1">
                Emergency Phrases
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Important phrases for urgent situations
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-300">
              <Mic className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-1">
                Free Speaking
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Practice speaking freely in Rohingya
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-300">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-1">
                When Pulsing
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Tap microphone when you see pulsing circles and hear the beep
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-orange-600 dark:text-orange-300">
              <Volume2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-1">
                Listen & Repeat
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Tap any phrase to hear pronunciation, then repeat
              </p>
            </div>
          </div>
        </div>

        {/* Audio indicator */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 inline-flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            <span>Audio explanation playing in Rohingya</span>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
