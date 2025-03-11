// src/app/api/subscribed-channels/route.ts - API endpoint for fetching details of subscribed channels
import { createSupabaseServiceClient } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { channelIds } = await req.json();

  if (!Array.isArray(channelIds) || channelIds.length === 0) {
    return NextResponse.json([], { status: 200 });
  }

  const supabase = await createSupabaseServiceClient();
  const { data, error } = await supabase
    .from('channels')
    .select('id, name, description')
    .in('id', channelIds);

  if (error) {
    console.error('Error fetching subscribed channels:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}
