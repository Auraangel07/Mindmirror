import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get user from session
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { roleId, roleName } = body;

    if (!roleId || !roleName) {
      return NextResponse.json(
        { error: 'Missing required fields: roleId, roleName' },
        { status: 400 }
      );
    }

    // Get user agent and device info
    const userAgent = request.headers.get('user-agent') || '';
    const deviceType = userAgent.includes('Mobile') ? 'mobile' : 
                      userAgent.includes('Tablet') ? 'tablet' : 'desktop';

    // Create interview session
    const { data: session, error } = await supabase
      .from('interview_sessions')
      .insert([{
        user_id: user.id,
        role_id: roleId,
        role_name: roleName,
        status: 'in_progress',
        total_duration: 0,
        overall_score: 0,
        questions_count: 0,
        responses_count: 0,
        xp_earned: 0,
        metadata: {
          user_agent: userAgent,
          device_type: deviceType,
          browser_info: userAgent,
        },
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating interview session:', error);
      return NextResponse.json(
        { error: 'Failed to create interview session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sessionId: session.id,
      message: 'Interview session started successfully',
    });
  } catch (error) {
    console.error('Error starting interview session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}