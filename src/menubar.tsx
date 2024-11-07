// src/menubar.tsx
import { useState, useEffect } from "react";
import { MenuBarExtra, Icon, showToast, Toast, Color } from "@raycast/api";
import { api } from "./api";
import { Session } from './types';

export default function Command() {
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkActiveSession();
    const interval = setInterval(checkActiveSession, 5000);
    return () => clearInterval(interval);
  }, []);

  async function checkActiveSession() {
    try {
      const data = await api.getActiveSessions();
      
      if (data.count > 0) {
        setActiveSession(data.active_sessions[0]);
      } else {
        setActiveSession(null);
      }
    } catch (error) {
      console.error('Failed to check active session:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function startNewSession(contextName: string) {
    try {
      const context = await api.createContext(contextName);
      const session = await api.startSession(context.context_id);

      setActiveSession(session);
      await showToast(Toast.Style.Success, `Started ${contextName} session`);
    } catch (error) {
      console.error('Failed to start session:', error);
      await showToast(Toast.Style.Failure, 'Failed to start session');
    }
  }

  async function endCurrentSession() {
    if (!activeSession) return;

    try {
      await api.endSession(activeSession.session_id);
      setActiveSession(null);
      await showToast(Toast.Style.Success, 'Session ended');
    } catch (error) {
      console.error('Failed to end session:', error);
      await showToast(Toast.Style.Failure, 'Failed to end session');
    }
  }

  async function generateSummary() {
    if (!activeSession) return;

    try {
      await api.generateSummary(activeSession.session_id);
      await showToast(Toast.Style.Success, 'Summary generated');
    } catch (error) {
      console.error('Failed to generate summary:', error);
      await showToast(Toast.Style.Failure, 'Failed to generate summary');
    }
  }

  if (isLoading) {
    return (
      <MenuBarExtra icon={Icon.Circle} title="Loading...">
        <MenuBarExtra.Item title="Loading..." />
      </MenuBarExtra>
    );
  }

  return (
    <MenuBarExtra
      icon={{ source: activeSession ? Icon.CircleFilled : Icon.Circle, tintColor: activeSession ? Color.Red : Color.PrimaryText }}
      title={activeSession ? "Recording..." : "Start Session"}
      tooltip={activeSession ? "Context Tracker - Recording" : "Context Tracker - Idle"}
    >
      {activeSession ? (
        <>
          <MenuBarExtra.Item
            title="Current Session"
            icon={Icon.Clock}
            subtitle={new Date(activeSession.start_time).toLocaleTimeString()}
          />
          <MenuBarExtra.Separator />
          <MenuBarExtra.Item
            title="End Session"
            icon={Icon.Stop}
            shortcut={{ modifiers: ["cmd"], key: "e" }}
            onAction={endCurrentSession}
          />
          <MenuBarExtra.Item
            title="Generate Summary"
            icon={Icon.Document}
            shortcut={{ modifiers: ["cmd"], key: "s" }}
            onAction={generateSummary}
          />
        </>
      ) : (
        <>
          <MenuBarExtra.Item
            title="Start Work Session"
            icon={Icon.Monitor}
            shortcut={{ modifiers: ["cmd"], key: "1" }}
            onAction={() => startNewSession("Work")}
          />
          <MenuBarExtra.Item
            title="Start Learning Session"
            icon={Icon.Book}
            shortcut={{ modifiers: ["cmd"], key: "2" }}
            onAction={() => startNewSession("Learning")}
          />
          <MenuBarExtra.Item
            title="Start Project Session"
            icon={Icon.Hammer}
            shortcut={{ modifiers: ["cmd"], key: "3" }}
            onAction={() => startNewSession("Project")}
          />
        </>
      )}
    </MenuBarExtra>
  );
}