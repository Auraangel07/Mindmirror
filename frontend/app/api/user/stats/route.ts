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

    // Get comprehensive user statistics
    const [
      { data: userProfile },
      { data: sessions },
      { data: responses },
      { data: achievements },
      { data: skills }
    ] = await Promise.all([
      supabase.from('users').select('*').eq('id', user.id).single(),
      supabase.from('interview_sessions').select('*').eq('user_id', user.id),
      supabase.from('interview_responses').select('*').eq('user_id', user.id),
      supabase.from('user_achievements').select('*').eq('user_id', user.id),
      supabase.from('user_skills').select('*').eq('user_id', user.id)
    ]);

    const completedSessions = sessions?.filter(s => s.status === 'completed') || [];
    const totalXP = userProfile?.total_xp || 0;
    const currentLevel = userProfile?.level || 1;
    
    // Calculate performance metrics
    const averageScore = completedSessions.length > 0 
      ? completedSessions.reduce((sum, s) => sum + s.overall_score, 0) / completedSessions.length 
      : 0;

    const totalInterviewTime = completedSessions.reduce((sum, s) => sum + s.total_duration, 0);
    
    // Calculate improvement trend (last 5 vs previous 5 sessions)
    const recentSessions = completedSessions.slice(0, 5);
    const previousSessions = completedSessions.slice(5, 10);
    
    const recentAverage = recentSessions.length > 0 
      ? recentSessions.reduce((sum, s) => sum + s.overall_score, 0) / recentSessions.length 
      : 0;
    
    const previousAverage = previousSessions.length > 0 
      ? previousSessions.reduce((sum, s) => sum + s.overall_score, 0) / previousSessions.length 
      : 0;
    
    const improvementTrend = recentAverage - previousAverage;

    // Calculate category performance
    const categoryPerformance = {};
    responses?.forEach(response => {
      const category = response.question_category;
      if (!categoryPerformance[category]) {
        categoryPerformance[category] = { total: 0, count: 0 };
      }
      categoryPerformance[category].total += response.evaluation.score;
      categoryPerformance[category].count += 1;
    });

    const categoryAverages = Object.entries(categoryPerformance).map(([category, data]: [string, any]) => ({
      category,
      average: Math.round(data.total / data.count),
      count: data.count
    }));

    // Calculate skill levels
    const skillLevels = skills?.map(skill => ({
      name: skill.skill_name,
      level: skill.current_level,
      xp: skill.total_xp,
      category: skill.skill_category
    })) || [];

    // Calculate next level progress
    const xpForNextLevel = currentLevel * 1000;
    const progressToNextLevel = ((totalXP % 1000) / 1000) * 100;

    return NextResponse.json({
      overview: {
        totalXP,
        currentLevel,
        progressToNextLevel: Math.round(progressToNextLevel),
        xpForNextLevel,
        totalInterviews: completedSessions.length,
        averageScore: Math.round(averageScore),
        totalInterviewTime,
        achievementsUnlocked: achievements?.length || 0,
        improvementTrend: Math.round(improvementTrend)
      },
      performance: {
        categoryAverages,
        recentSessions: recentSessions.map(session => ({
          date: session.completed_at,
          score: session.overall_score,
          role: session.role_name,
          duration: session.total_duration
        })),
        skillLevels
      },
      achievements: achievements?.map(achievement => ({
        id: achievement.achievement_id,
        name: achievement.achievement_name,
        description: achievement.achievement_description,
        icon: achievement.achievement_icon,
        unlockedAt: achievement.unlocked_at,
        category: achievement.category,
        xpReward: achievement.xp_reward
      })) || []
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}