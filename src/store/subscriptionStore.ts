import { create } from 'zustand';

interface SubscriptionState {
  subscribedChannels: string[];
  isLoading: boolean;
  error: string | null;
  fetchSubscriptions: () => Promise<void>;
  subscribe: (channelId: string) => Promise<void>;
  unsubscribe: (channelId: string) => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>(set => ({
  subscribedChannels: [],
  isLoading: false,
  error: null,
  fetchSubscriptions: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/subscriptions');
      if (!response.ok) throw new Error('Failed to fetch subscriptions');
      const data = await response.json();
      set({ subscribedChannels: data, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Unknown error', isLoading: false });
    }
  },
  subscribe: async (channelId: string) => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId }),
      });
      if (!response.ok) throw new Error('Failed to subscribe');
      set(state => ({
        subscribedChannels: [...state.subscribedChannels, channelId],
        isLoading: false,
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Unknown error', isLoading: false });
    }
  },
  unsubscribe: async (channelId: string) => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId }),
      });
      if (!response.ok) throw new Error('Failed to unsubscribe');
      set(state => ({
        subscribedChannels: state.subscribedChannels.filter(id => id !== channelId),
        isLoading: false,
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Unknown error', isLoading: false });
    }
  },
}));
