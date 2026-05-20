import type { SupabaseClient } from "@supabase/supabase-js";

export type PresenceUser = {
  user_id: string;
  name: string | null;
  avatar?: string | null;
  cursor?: { x: number; y: number; blockId?: string } | null;
  lastSeen: number;
};

export class PresenceChannel {
  private channel: ReturnType<SupabaseClient["channel"]> | null = null;

  constructor(
    private supabase: SupabaseClient,
    private roomId: string,
    private user: { id: string; name: string | null; avatarUrl?: string | null },
  ) {}

  subscribe(onPresence: (users: PresenceUser[]) => void) {
    this.channel = this.supabase.channel(`presence:${this.roomId}`, {
      config: { presence: { key: this.user.id } },
    });

    this.channel
      .on("presence", { event: "sync" }, () => {
        const state = this.channel?.presenceState() ?? {};
        const users = Object.values(state).flat() as PresenceUser[];
        onPresence(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && this.channel) {
          await this.channel.track({
            user_id: this.user.id,
            name: this.user.name,
            avatar: this.user.avatarUrl,
            cursor: null,
            lastSeen: Date.now(),
          });
        }
      });

    return this;
  }

  async updateCursor(cursor: { x: number; y: number; blockId?: string }) {
    if (!this.channel) return;
    await this.channel.track({
      user_id: this.user.id,
      name: this.user.name,
      avatar: this.user.avatarUrl,
      cursor,
      lastSeen: Date.now(),
    });
  }

  unsubscribe() {
    if (this.channel) {
      void this.supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}
