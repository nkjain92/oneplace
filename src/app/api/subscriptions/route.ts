import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data, error } = await supabase
      .from('subscriptions')
      .select('channel_id')
      .eq('user_id', user.id);
    if (error) throw error;
    const channelIds = data.map(sub => sub.channel_id);
    return NextResponse.json(channelIds);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { channelId } = await request.json();
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { error } = await supabase
      .from('subscriptions')
      .insert([{ user_id: user.id, channel_id: channelId }]);
    if (error) throw error;
    return NextResponse.json({ message: 'Subscribed successfully' });
  } catch (error) {
    console.error('Error subscribing:', error);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { channelId } = await request.json();
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('channel_id', channelId);
    if (error) throw error;
    return NextResponse.json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
  }
}
