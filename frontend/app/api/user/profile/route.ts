import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
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

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get user's interview sessions
    const { data: sessions } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(10);
    
    // Get user's achievements
    const { data: achievements } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', user.id)
      .order('unlocked_at', { ascending: false });
    
    // Get user's skills
    const { data: skills } = await supabase
      .from('user_skills')
      .select('*')
      .eq('user_id', user.id)
      .order('total_xp', { ascending: false });

    // Calculate statistics
    const completedSessions = sessions?.filter(s => s.status === 'completed') || [];
    const averageScore = completedSessions.length > 0 
      ? completedSessions.reduce((sum, s) => sum + s.overall_score, 0) / completedSessions.length 
      : 0;
    
    const totalInterviewTime = completedSessions.reduce((sum, s) => sum + s.total_duration, 0);

    return NextResponse.json({
      user: userProfile,
      statistics: {
        totalInterviews: completedSessions.length,
        averageScore: Math.round(averageScore),
        totalInterviewTime,
        achievementsUnlocked: achievements?.length || 0,
        currentStreak: calculateStreak(sessions || []),
      },
      recentSessions: sessions?.slice(0, 5) || [],
      achievements: achievements || [],
      skills: skills || [],
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get user from session
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ') ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { displayName, preferences } = body;

    // Update user profile
    const updates: any = { updated_at: new Date().toISOString() };
    if (displayName) updates.display_name = displayName;
    if (preferences) updates.preferences = preferences;

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      console.error('Error updating user profile:', error);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateStreak(sessions: any[]): number {
  // Simple streak calculation - consecutive days with completed interviews
  const completedSessions = sessions
    .filter(s => s.status === 'completed')
    .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());

  if (completedSessions.length === 0) return 0;

  let streak = 1;
  let currentDate = new Date(completedSessions[0].completed_at);
  
  for (let i = 1; i < completedSessions.length; i++) {
    const sessionDate = new Date(completedSessions[i].completed_at);
    const daysDiff = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      streak++;
      currentDate = sessionDate;
    } else {
      break;
    }
  }

  return streak;
}