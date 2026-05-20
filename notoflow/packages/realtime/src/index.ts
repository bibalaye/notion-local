import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js"; // use raw client to keep package decoupled

export interface RealtimeUser {
  id: string;
  name: string;
  avatarUrl?: string | null;
  color: string;
}

export interface CollaborativeCursor {
  id: string;
  name: string;
  color: string;
  pos: number;
}

// Custom hook for collaboration
export function usePageRealtime(
  supabaseUrl: string,
  supabaseAnonKey: string,
  pageId: string,
  currentUser: RealtimeUser,
  onRemoteDocUpdate?: () => void,
) {
  const [activeUsers, setActiveUsers] = useState<RealtimeUser[]>([]);
  const [collaborativeCursors, setCollaborativeCursors] = useState<CollaborativeCursor[]>([]);
  
  const channelRef = useRef<any>(null);
  const cursorsRef = useRef<Record<string, CollaborativeCursor>>({});

  useEffect(() => {
    if (!pageId || !currentUser.id) return;

    // Initialize Supabase Client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const channelName = `page_collaboration:${pageId}`;
    
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: currentUser.id,
        },
      },
    });

    channelRef.current = channel;

    // Track active users presence
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const usersList: RealtimeUser[] = [];
        
        Object.entries(state).forEach(([userId, presences]: any) => {
          if (userId === currentUser.id) return; // skip self
          const presence = presences[0];
          if (presence) {
            usersList.push({
              id: userId,
              name: presence.name,
              avatarUrl: presence.avatarUrl,
              color: presence.color,
            });
          }
        });
        
        setActiveUsers(usersList);
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        // Option to display join toast or updates
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        // Remove cursor of left user
        const newCursors = { ...cursorsRef.current };
        delete newCursors[key];
        cursorsRef.current = newCursors;
        setCollaborativeCursors(Object.values(newCursors));
      });

    // Listen to broadcast cursors & updates
    channel
      .on("broadcast", { event: "cursor-move" }, ({ payload }) => {
        if (payload.userId === currentUser.id) return;
        
        const currentCursors = { ...cursorsRef.current };
        currentCursors[payload.userId] = {
          id: payload.userId,
          name: payload.userName,
          color: payload.color,
          pos: payload.pos,
        };
        
        cursorsRef.current = currentCursors;
        setCollaborativeCursors(Object.values(currentCursors));
      })
      .on("broadcast", { event: "doc-update" }, () => {
        // Trigger page content refetch in the app
        onRemoteDocUpdate?.();
      });

    // Subscribe to channel
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          id: currentUser.id,
          name: currentUser.name,
          avatarUrl: currentUser.avatarUrl,
          color: currentUser.color,
        });
      }
    });

    return () => {
      channel.unsubscribe();
      cursorsRef.current = {};
      setCollaborativeCursors([]);
      setActiveUsers([]);
      channelRef.current = null;
    };
  }, [supabaseUrl, supabaseAnonKey, pageId, currentUser.id, currentUser.name, currentUser.avatarUrl, currentUser.color]);

  // Broadcast function for local cursor selection changes
  const broadcastCursorMove = useCallback(
    (pos: number) => {
      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "cursor-move",
          payload: {
            userId: currentUser.id,
            userName: currentUser.name,
            color: currentUser.color,
            pos,
          },
        });
      }
    },
    [currentUser.id, currentUser.name, currentUser.color],
  );

  // Broadcast function for page update changes
  const broadcastDocUpdate = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "doc-update",
        payload: {
          userId: currentUser.id,
        },
      });
    }
  }, [currentUser.id]);

  return {
    activeUsers,
    collaborativeCursors,
    broadcastCursorMove,
    broadcastDocUpdate,
  };
}
