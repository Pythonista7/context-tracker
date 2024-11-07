import {
    ActionPanel,
    Action,
    List,
    Icon,
    Color,
    showToast,
    Toast,
  } from "@raycast/api";
  import { useState, useEffect } from "react";
  import { api } from "./api";
  import { Session, SessionEvent } from './types';
  
  export default function Command() {
    const [activeSession, setActiveSession] = useState<Session | null>(null);
    const [sessionEvents, setSessionEvents] = useState<SessionEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchText, setSearchText] = useState("");
  
    // Load active session on mount
    useEffect(() => {
      checkActiveSession();
      const interval = setInterval(checkActiveSession, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }, []);
  
    // Fetch active session and its events
    async function checkActiveSession() {
      try {
        const data = await api.getActiveSessions();
        
        if (data.count > 0) {
          const session = data.active_sessions[0];
          setActiveSession(session);
          loadSessionEvents(session.session_id);
        } else {
          setActiveSession(null);
          setSessionEvents([]);
        }
      } catch (error) {
        console.error('Failed to check active session:', error);
        await showToast(Toast.Style.Failure, 'Failed to check session status');
      } finally {
        setIsLoading(false);
      }
    }
  
    async function loadSessionEvents(sessionId: number) {
      try {
        const events = await api.getSessionEvents(sessionId);
        setSessionEvents(events);
      } catch (error) {
        console.error('Failed to load session events:', error);
      }
    }
  
    async function startNewSession(contextName: string) {
      try {
        const context = await api.createContext(contextName);
        const session = await api.startSession(context.context_id);
        
        setActiveSession(session);
        await showToast(Toast.Style.Success, `Started ${contextName} session`);
        loadSessionEvents(session.session_id);
      } catch (error) {
        console.error('Failed to start session:', error);
        await showToast(Toast.Style.Failure, 'Failed to start session');
      }
    }
  
    async function endCurrentSession() {
      if (!activeSession) return;
  
      try {
        await api.endSession(activeSession.session_id);
        console.log(`Session ${activeSession.session_id} ended`);
        setActiveSession(null);
        setSessionEvents([]);
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
  
    return (
      <List
        isLoading={isLoading}
        searchBarPlaceholder="Search sessions and events..."
        searchText={searchText}
        onSearchTextChange={setSearchText}
      >
        {/* Active Session Section */}
        {activeSession && (
          <List.Section title="Active Session">
            <List.Item
              icon={{ source: Icon.Video, tintColor: Color.Red }}
              title={`Recording since ${new Date(activeSession.start_time).toLocaleTimeString()}`}
              accessories={[
                { icon: Icon.Clock },
                { text: "Recording" }
              ]}
              actions={
                <ActionPanel>
                  <Action
                    title="End Session"
                    icon={Icon.Stop}
                    onAction={endCurrentSession}
                  />
                  <Action
                    title="Generate Summary"
                    icon={Icon.Document}
                    onAction={generateSummary}
                  />
                </ActionPanel>
              }
            />
          </List.Section>
        )}
  
        {/* Session Events Section */}
        {sessionEvents.length > 0 && (
          <List.Section title="Recent Events">
            {sessionEvents
              .filter(event => 
                event.event_type?.toLowerCase().includes(searchText.toLowerCase())
              )
              .map(event => (
                <List.Item
                  key={event.event_id}
                  icon={Icon.Circle}
                  title={event.event_type}
                  subtitle={new Date(event.timestamp).toLocaleTimeString()}
                  accessories={[{ text: event.event_data.summary || "" }]}
                />
              ))}
          </List.Section>
        )}
  
        {/* Quick Actions Section */}
        <List.Section title="Quick Actions">
          {!activeSession ? (
            <>
              <List.Item
                icon={Icon.Monitor}
                title="Start Work Session"
                actions={
                  <ActionPanel>
                    <Action
                      title="Start Session"
                      onAction={() => startNewSession("Work")}
                    />
                  </ActionPanel>
                }
              />
              <List.Item
                icon={Icon.Book}
                title="Start Learning Session"
                actions={
                  <ActionPanel>
                    <Action
                      title="Start Session"
                      onAction={() => startNewSession("Learning")}
                    />
                  </ActionPanel>
                }
              />
              <List.Item
                icon={Icon.Hammer}
                title="Start Project Session"
                actions={
                  <ActionPanel>
                    <Action
                      title="Start Session"
                      onAction={() => startNewSession("Project")}
                    />
                  </ActionPanel>
                }
              />
            </>
          ) : (
            <List.Item
              icon={Icon.Document}
              title="View Full Summary"
              actions={
                <ActionPanel>
                  <Action
                    title="Generate Summary"
                    onAction={generateSummary}
                  />
                </ActionPanel>
              }
            />
          )}
        </List.Section>
      </List>
    );
  }