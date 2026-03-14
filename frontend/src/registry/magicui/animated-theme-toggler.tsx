import { AnimatePresence, motion } from "motion/react";
import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/app/context/theme-context";
import { cn } from "@/app/components/ui/utils";

export function AnimatedThemeToggler({
  className,
}: {
  className?: string;
}) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "w-14 h-14 rounded-xl flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-800 transition-all",
        className
      )}
      title={isDark ? "Light Mode" : "Dark Mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      type="button"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? "sun" : "moon"}
          initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="inline-flex"
        >
          {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

export function AnimatedThemeTogglerDemo() {
  return <AnimatedThemeToggler />;
}
