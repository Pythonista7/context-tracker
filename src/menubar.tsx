// src/menubar.tsx
import { useState, useEffect } from "react";
import { MenuBarExtra, Icon, showToast, Toast, Color, Detail, open } from "@raycast/api";
import { api } from "./api";
import { Session, Context, SessionSummary } from './types';

export default function Command() {
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [contexts, setContexts] = useState<Context[]>([]);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);

  useEffect(() => {
    checkActiveSession();
    loadContexts();
    const interval = setInterval(checkActiveSession, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadContexts() {
    try {
      const availableContexts = await api.getContexts();
      setContexts(availableContexts);
    } catch (error) {
      console.error('Failed to load contexts:', error);
      await showToast(Toast.Style.Failure, 'Failed to load contexts');
    }
  }

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

  // async function endCurrentSession() {
  //   if (!activeSession) return;

  //   try {
  //     const { path } = await api.saveSession(activeSession.session_id,"Save the session summary to meaningfully formatted markdown file." );
  //     await api.endSession(activeSession.session_id);
  //     // Open in Obsidian using the obsidian:// protocol
  //     await open(`obsidian://open?vault=context-tracker&file=${encodeURIComponent(path)}`);
  //     await showToast(Toast.Style.Success, 'Session saved and ended');
  //     setActiveSession(null);
  //     await showToast(Toast.Style.Success, 'Session saved and ended');
  //   } catch (error) {
  //     console.error('Failed to end session:', error);
  //     await showToast(Toast.Style.Failure, 'Failed to end session');
  //   }
  // }
  
  async function endCurrentSession() {
    if (!activeSession) return;

    try {
      const {session_id, summary} = await api.endSession(activeSession.session_id);
      const { path } = await api.saveSession(session_id, "Save the session summary to meaningfully formatted markdown file." );
      console.log(`Session ${session_id} ended`);
      
      setActiveSession(null);
      
      // Open in Obsidian using the obsidian:// protocol
      await open(`obsidian://open?vault=context-tracker&file=${encodeURIComponent(path)}`);
      await showToast(Toast.Style.Success, 'Session saved and ended');
    } catch (error) {
      console.error('Failed to end session:', error);
      await showToast(Toast.Style.Failure, 'Failed to end session');
    }
  }

  async function generateSummary() {
    if (!activeSession) return;

    try {
      const summary = await api.generateSummary(activeSession.session_id);
      
      const markdownContent = `# Session Summary
      
## Overview
${summary.overview}

## Key Topics
${summary.key_topics.map(topic => `- ${topic}`).join('\n')}

## Learning Highlights
${summary.learning_highlights.map(highlight => `- ${highlight}`).join('\n')}

## Resources Used
${summary.resources_used.map(resource => `- ${resource}`).join('\n')}

## Conclusion
${summary.conclusion}
`;

      // Show the summary in a Detail view
      await showToast(Toast.Style.Success, 'Summary MD generated');
      return <Detail markdown={markdownContent} />;
      
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
            onAction={generateSummary}
          />
        </>
      ) : (
        <>
          {contexts.map(context => (
            <MenuBarExtra.Item
              key={context.context_id}
              title={`Start ${context.name} Session`}
              icon={Icon.Circle}
              onAction={() => startNewSession(context.name)}
            />
          ))}
        </>
      )}
    </MenuBarExtra>
  );
}