import {
  ActionPanel,
  Action,
  List,
  showToast,
  Toast,
  Icon,
  MenuBarExtra,
  open,
  LocalStorage,
  launchCommand,
  LaunchType
} from "@raycast/api";
import { useState, useEffect } from "react";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { Context, saveCurrentContext } from "./utils/storage";


// Command definitions matching our spec
const COMMANDS = [
  { 
    id: "switch", 
    title: "Switch Context", 
    icon: Icon.Switch,
  },
  { 
    id: "create", 
    title: "Create New Context", 
    icon: Icon.Plus,
  },
  { 
    id: "capture", 
    title: "Capture Thought", 
    icon: Icon.Pencil,
  },
  { 
    id: "aha", 
    title: "Mark Aha Moment", 
    icon: Icon.LightBulb,
  },
  { 
    id: "resource", 
    title: "Add Resource", 
    icon: Icon.Link,
  },
  { 
    id: "summary", 
    title: "Generate Summary", 
    icon: Icon.Document,
  },
  { 
    id: "export", 
    title: "Export as Blog", 
    icon: Icon.Upload,
  },
];

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const [contexts, setContexts] = useState<Context[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentContext, setCurrentContext] = useState<Context | null>(null);

  useEffect(() => {
    const checkMenuBar = async () => {
      // You can store a flag in LocalStorage when menu bar is enabled
      const isMenuBarEnabled = await LocalStorage.getItem("menuBarEnabled");
      if (!isMenuBarEnabled) {
        await showToast({
          style: Toast.Style.Animated,
          title: "Tip: Enable Menu Bar Indicator",
          message: "Go to Extensions > Context Tracker to enable the menu bar indicator"
        });
      }
    };
    
    checkMenuBar();
  }, []);
  
  useEffect(() => {
    loadContexts();
  }, []);

  async function loadContexts() {
    try {
      const dataPath = path.join(process.env.HOME!, ".dev-context-tracker", "contexts.json");
      const data = await readFile(dataPath, "utf-8");
      const loadedContexts = JSON.parse(data);
      setContexts(loadedContexts);
      
      // Find current context
      const current = loadedContexts.find((c: Context) => c.lastActive === "current");
      setCurrentContext(current || null);
    } catch (error) {
      // If file doesn't exist yet, create with default contexts
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        const defaultContexts: Context[] = [
          {
            id: "work",
            name: "Work",
            color: "#FF6B6B",
            lastActive: "current",
            notes: [],
            resources: []
          },
          {
            id: "learning",
            name: "Learning",
            color: "#4ECDC4",
            lastActive: "",
            notes: [],
            resources: []
          }
        ];
        await saveContexts(defaultContexts);
        setContexts(defaultContexts);
        setCurrentContext(defaultContexts[0]);
      } else {
        await showToast({
          style: Toast.Style.Failure,
          title: "Failed to load contexts",
          message: String(error),
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCommand(command: string, context?: Context) {
    switch (command) {
      case "switch":
        if (context) {
          await switchContext(context);
        }
        break;
      case "create":
        await createNewContext();
        break;
      case "capture":
        await captureThought();
        break;
      default:
        await showToast({
          style: Toast.Style.Animated,
          title: `${command} command coming soon!`,
        });
    }
  }

  async function switchContext(newContext: Context) {
    try {
      // First update LocalStorage before anything else
      await LocalStorage.setItem("currentContext", JSON.stringify({
        ...newContext,
        lastActive: "current"
      }));
  
      // Now update contexts file
      const updatedContexts = contexts.map(c => ({
        ...c,
        lastActive: c.id === newContext.id ? "current" : "",
      }));
      await saveContexts(updatedContexts);
      
      // Update local state
      setContexts(updatedContexts);
      setCurrentContext(newContext);
      
      // Force menu bar to reload
      await launchCommand({
        name: "context-menubar",
        type: LaunchType.Background,
        fallback: {
          type: LaunchType.Background
        }
      });
  
      await showToast({
        style: Toast.Style.Success,
        title: `Switched to ${newContext.name}`,
      });
    } catch (error) {
      console.error('Switch context error:', error);
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to switch context",
        message: String(error),
      });
    }
  }

  async function createNewContext() {
    await showToast({
      style: Toast.Style.Animated,
      title: "Create Context coming soon!",
    });
  }

  async function captureThought() {
    await showToast({
      style: Toast.Style.Animated,
      title: "Capture Thought coming soon!",
    });
  }

  async function saveContexts(updatedContexts: Context[]) {
    const dataPath = path.join(process.env.HOME!, ".dev-context-tracker", "contexts.json");
    // Ensure directory exists
    await mkdir(path.dirname(dataPath), { recursive: true });
    await writeFile(dataPath, JSON.stringify(updatedContexts, null, 2));
  }

  // Filter items based on search text
  const filteredCommands = COMMANDS.filter((command) =>
    command.title.toLowerCase().includes(searchText.toLowerCase())
  );

  const filteredContexts = contexts.filter((context) =>
    context.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search commands or contexts..."
      searchText={searchText}
      onSearchTextChange={setSearchText}
      navigationTitle="Developer Context Tracker"
    >
      <List.Section title="Current Context">
        {currentContext && (
          <List.Item
            icon={{ source: Icon.Circle, tintColor: currentContext.color }}
            title={currentContext.name}
            subtitle="Active Context"
            accessories={[{ text: "Active", icon: Icon.CheckCircle }]}
            actions={
              <ActionPanel>
                <Action
                  title="View Details"
                  icon={Icon.Sidebar}
                  onAction={() => handleCommand("view", currentContext)}
                />
              </ActionPanel>
            }
          />
        )}
      </List.Section>

      <List.Section title="Commands">
        {filteredCommands.map((command) => (
          <List.Item
            key={command.id}
            icon={command.icon}
            title={command.title}
            actions={
              <ActionPanel>
                <Action
                  title={command.title}
                  onAction={() => handleCommand(command.id)}
                />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>

      <List.Section title="Available Contexts">
        {filteredContexts.map((context) => (
          <List.Item
            key={context.id}
            icon={{ source: Icon.Circle, tintColor: context.color }}
            title={context.name}
            accessories={[
              { 
                text: context.lastActive === "current" ? "Active" : "",
                icon: context.lastActive === "current" ? Icon.CheckCircle : undefined
              }
            ]}
            actions={
              <ActionPanel>
                <Action
                  title={`Switch to ${context.name}`}
                  onAction={() => handleCommand("switch", context)}
                />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}

