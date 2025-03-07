import { create } from 'zustand';

interface SubscriptionState {
  subscribedChannels: string[];
  loadingChannels: string[];
  error: string | null;
  fetchSubscriptions: () => Promise<void>;
  subscribe: (channelId: string) => Promise<void>;
  unsubscribe: (channelId: string) => Promise<void>;
  isChannelLoading: (channelId: string) => boolean;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscribedChannels: [],
  loadingChannels: [],
  error: null,
  isChannelLoading: (channelId: string): boolean => get().loadingChannels.includes(channelId),
  fetchSubscriptions: async () => {
    try {
      const response = await fetch('/api/subscriptions');
      if (!response.ok) throw new Error('Failed to fetch subscriptions');
      const data = await response.json();
      set({ subscribedChannels: data });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
  },
  subscribe: async (channelId: string) => {
    set((state: SubscriptionState) => ({
      loadingChannels: state.loadingChannels.includes(channelId)
        ? state.loadingChannels
        : [...state.loadingChannels, channelId],
    }));
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId }),
      });
      if (!response.ok) throw new Error('Failed to subscribe');
      set((state: SubscriptionState) => ({
        subscribedChannels: [...state.subscribedChannels, channelId],
        loadingChannels: state.loadingChannels.filter(id => id !== channelId),
      }));
    } catch (err) {
      set((state: SubscriptionState) => ({
        error: err instanceof Error ? err.message : 'Unknown error',
        loadingChannels: state.loadingChannels.filter(id => id !== channelId),
      }));
    }
  },
  unsubscribe: async (channelId: string) => {
    set((state: SubscriptionState) => ({
      loadingChannels: state.loadingChannels.includes(channelId)
        ? state.loadingChannels
        : [...state.loadingChannels, channelId],
    }));
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId }),
      });
      if (!response.ok) throw new Error('Failed to unsubscribe');
      set((state: SubscriptionState) => ({
        subscribedChannels: state.subscribedChannels.filter(id => id !== channelId),
        loadingChannels: state.loadingChannels.filter(id => id !== channelId),
      }));
    } catch (err) {
      set((state: SubscriptionState) => ({
        error: err instanceof Error ? err.message : 'Unknown error',
        loadingChannels: state.loadingChannels.filter(id => id !== channelId),
      }));
    }
  },
}));
