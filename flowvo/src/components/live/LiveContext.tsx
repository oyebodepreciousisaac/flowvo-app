import { createContext, useContext } from "react";

export interface LiveContextType {
  isLive: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  triggerManualSync: () => Promise<void>;
  notification: string | null;
  clearNotification: () => void;
}

export const LiveContext = createContext<LiveContextType>({
  isLive: true,
  isSyncing: false,
  lastSyncTime: null,
  triggerManualSync: async () => {},
  notification: null,
  clearNotification: () => {},
});

export function useLiveSync() {
  return useContext(LiveContext);
}
