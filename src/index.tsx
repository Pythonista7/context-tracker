import {
    ActionPanel,
    Action,
    List,
    Icon,
    Color,
    showToast,
    Toast,
    Form,
    useNavigation,
  } from "@raycast/api";
  import { useState, useEffect } from "react";
  import { api } from "./api";
  import { Session, SessionEvent, Context } from './types';
  
  function CreateContextForm({
    onSubmit,
  }: {
    onSubmit: (name: string, description: string) => Promise<void>;
  }) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const { pop } = useNavigation();

    return (
      <Form
        actions={
          <ActionPanel>
            <Action.SubmitForm
              title="Create New Context"
              onSubmit={async () => {
                await onSubmit(name, description);
                pop();
              }}
            />
          </ActionPanel>
        }
      >
        <Form.TextField
          id="name"
          title="Context Name"
          placeholder="Enter context name"
          value={name}
          onChange={setName}
        />
        <Form.TextField
          id="description"
          title="Description"
          placeholder="Enter context description"
          value={description}
          onChange={setDescription}
        />
      </Form>
    );
  }
  
  export default function Command() {
    const [activeSession, setActiveSession] = useState<Session | null>(null);
    const [sessionEvents, setSessionEvents] = useState<SessionEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchText, setSearchText] = useState("");
    const [contexts, setContexts] = useState<Context[]>([]);
  
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
  
    useEffect(() => {
      loadContexts();
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
        <List.Item
          icon={Icon.Plus}
          title="New Context"
          actions={
            <ActionPanel>
              <Action.Push
                title="Create Custom Session"
                target={
                  <CreateContextForm 
                    onSubmit={async (name, description) => {
                      await api.createContext(name, description);
                      await loadContexts();
                    }} 
                  />
                }
              />
            </ActionPanel>
          }
        />
          {!activeSession && contexts.map(context => (
            <List.Item
              key={context.context_id}
              icon={Icon.Circle}
              title={`Start ${context.name} Session`}
              subtitle={context.description}
              actions={
                <ActionPanel>
                  <Action
                    title="Start Session"
                    onAction={() => startNewSession(context.name)}
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      </List>
    );
  }