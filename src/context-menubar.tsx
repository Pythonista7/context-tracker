// src/context-menubar.tsx
import { Icon, launchCommand, LaunchType, MenuBarExtra } from "@raycast/api";
import { useEffect, useState } from "react";
import { Context, getCurrentContext } from "./utils/storage";
import { cacheService } from "./utils/cache";

export default function ContextMenuBar() {
  const [currentContext, setCurrentContext] = useState<Context | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0); // Add a counter for load attempts

  // Load context whenever loadAttempt changes
  useEffect(() => {
    const loadContext = async () => {
      try {
        const context = await getCurrentContext();
        setCurrentContext(context);
        console.log("Current context:", context);
      } catch (error) {
        console.error('Failed to load context:', error);
      }
    };

    loadContext();
    
  }, [loadAttempt]);

  useEffect(() => {
    cacheService.updateContextChangeTimestamp();
  }, [currentContext]);

  // Initial load on mount and periodic check for updates
  useEffect(() => {
    // Check for updates every second
    const interval = setInterval(() => {
      setLoadAttempt(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // If we're on first load and have no context, show loading
  if (loadAttempt === 0 && !currentContext) {
    return <MenuBarExtra icon={{ source: Icon.Circle, tintColor: "#999" }} title="Loading..." />;
  }

  // After first load, always show a context (or No Context)
  if (!currentContext) {
    return (
      <MenuBarExtra icon={{ source: Icon.Circle, tintColor: "#999" }} title="No Context">
        <MenuBarExtra.Item 
          title="Open Context Manager" 
          onAction={() => launchCommand({ name: "ctx", type: LaunchType.UserInitiated })} 
        />
      </MenuBarExtra>
    );
  }

  return (
    <MenuBarExtra 
      icon={{ source: Icon.Circle, tintColor: currentContext.color }}
      title={currentContext.name}
    >
      <MenuBarExtra.Item title={`Active: ${currentContext.name}`} />
      <MenuBarExtra.Separator />
      <MenuBarExtra.Item 
        title="Switch Context" 
        icon={Icon.Switch}
        onAction={() => launchCommand({ name: "ctx", type: LaunchType.UserInitiated })}
      />
    </MenuBarExtra>
  );
}