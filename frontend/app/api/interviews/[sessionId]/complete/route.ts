import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
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

    const sessionId = params.sessionId;
    const body = await request.json();
    const { totalDuration } = body;

    // Get all responses for this session
    const { data: responses, error: responsesError } = await supabase
      .from('interview_responses')
      .select('*')
      .eq('session_id', sessionId);

    if (responsesError || !responses || responses.length === 0) {
      return NextResponse.json(
        { error: 'No responses found for this session' },
        { status: 400 }
      );
    }

    // Calculate overall score
    const overallScore = Math.round(
      responses.reduce((sum, response) => sum + response.evaluation.score, 0) / responses.length
    );

    // Calculate XP earned based on score and difficulty
    const baseXP = 100;
    const scoreMultiplier = overallScore / 100;
    const difficultyBonus = responses.reduce((sum, response) => sum + response.question_difficulty * 10, 0);
    const xpEarned = Math.round((baseXP * scoreMultiplier) + difficultyBonus);

    // Update interview session
    const { error: updateError } = await supabase
      .from('interview_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        total_duration: totalDuration,
        overall_score: overallScore,
        questions_count: responses.length,
        responses_count: responses.length,
        xp_earned: xpEarned,
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Error updating interview session:', updateError);
      return NextResponse.json(
        { error: 'Failed to complete interview session' },
        { status: 500 }
      );
    }

    // Update user XP and level
    const { data: userProfile } = await supabase
      .from('users')
      .select('total_xp, level')
      .eq('id', user.id)
      .single();

    if (userProfile) {
      const newTotalXP = userProfile.total_xp + xpEarned;
      const newLevel = Math.floor(newTotalXP / 1000) + 1; // 1000 XP per level
      
      await supabase
        .from('users')
        .update({
          total_xp: newTotalXP,
          level: newLevel,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      // Check for achievements
      await checkAndUnlockAchievements(supabase, user.id, overallScore, responses.length, newLevel);

      // Update skills based on performance
      await updateUserSkills(supabase, user.id, responses);
    }

    return NextResponse.json({
      message: 'Interview completed successfully',
      overallScore,
      xpEarned,
      totalResponses: responses.length,
    });
  } catch (error) {
    console.error('Error completing interview:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function checkAndUnlockAchievements(
  supabase: any,
  userId: string, 
  score: number, 
  questionsAnswered: number, 
  userLevel: number
) {
  const achievements = [];

  // First interview achievement
  if (questionsAnswered >= 1) {
    achievements.push({
      user_id: userId,
      achievement_id: 'first-interview',
      achievement_name: 'First Steps',
      achievement_description: 'Complete your first interview',
      achievement_icon: '🎯',
      xp_reward: 50,
      category: 'milestone',
    });
  }

  // High score achievement
  if (score >= 80) {
    achievements.push({
      user_id: userId,
      achievement_id: 'high-scorer',
      achievement_name: 'Excellence',
      achievement_description: 'Score 80% or higher in an interview',
      achievement_icon: '⭐',
      xp_reward: 100,
      category: 'performance',
    });
  }

  // Perfect score achievement
  if (score >= 95) {
    achievements.push({
      user_id: userId,
      achievement_id: 'perfect-score',
      achievement_name: 'Perfection',
      achievement_description: 'Score 95% or higher in an interview',
      achievement_icon: '💎',
      xp_reward: 200,
      category: 'performance',
    });
  }

  // Level achievements
  if (userLevel >= 5) {
    achievements.push({
      user_id: userId,
      achievement_id: 'level-5',
      achievement_name: 'Rising Star',
      achievement_description: 'Reach level 5',
      achievement_icon: '🌟',
      xp_reward: 150,
      category: 'progression',
    });
  }

  if (userLevel >= 10) {
    achievements.push({
      user_id: userId,
      achievement_id: 'level-10',
      achievement_name: 'Expert',
      achievement_description: 'Reach level 10',
      achievement_icon: '🏆',
      xp_reward: 300,
      category: 'progression',
    });
  }

  // Insert achievements (ignore duplicates)
  for (const achievement of achievements) {
    try {
      await supabase
        .from('user_achievements')
        .insert([achievement]);
    } catch (error) {
      // Achievement might already exist, ignore error
      console.log('Achievement already exists or error creating:', achievement.achievement_id);
    }
  }
}

async function updateUserSkills(supabase: any, userId: string, responses: any[]) {
  const skillUpdates = new Map();

  // Analyze responses and update skills
  responses.forEach(response => {
    const { evaluation, question_category } = response;
    
    // Map categories to skills
    const skillMappings: { [key: string]: string[] } = {
      'Technical': ['Technical Skills', 'Problem Solving'],
      'Communication': ['Communication', 'Emotional Intelligence'],
      'Leadership': ['Leadership', 'Communication'],
      'Problem Solving': ['Problem Solving', 'Technical Skills'],
      'Behavioral': ['Emotional Intelligence', 'Communication'],
      'System Design': ['Technical Skills', 'Problem Solving'],
      'Database': ['Technical Skills'],
      'Best Practices': ['Technical Skills', 'Communication'],
      'UI/UX': ['Technical Skills', 'Communication'],
      'Architecture': ['Technical Skills', 'Problem Solving'],
      'Methodology': ['Problem Solving', 'Communication'],
      'Statistics': ['Technical Skills', 'Problem Solving'],
      'Strategy': ['Leadership', 'Problem Solving'],
      'Execution': ['Leadership', 'Communication'],
      'Decision Making': ['Leadership', 'Problem Solving'],
      'Collaboration': ['Communication', 'Emotional Intelligence'],
      'Process': ['Problem Solving', 'Communication'],
      'Research': ['Problem Solving', 'Communication'],
      'Accessibility': ['Technical Skills', 'Communication'],
      'CI/CD': ['Technical Skills'],
      'Monitoring': ['Technical Skills', 'Problem Solving'],
      'Infrastructure': ['Technical Skills'],
      'Troubleshooting': ['Problem Solving', 'Technical Skills'],
    };

    const skills = skillMappings[question_category] || ['Communication'];
    
    skills.forEach(skillName => {
      if (!skillUpdates.has(skillName)) {
        skillUpdates.set(skillName, {
          totalScore: 0,
          count: 0,
          xpGained: 0,
        });
      }
      
      const skillData = skillUpdates.get(skillName);
      skillData.totalScore += evaluation.score;
      skillData.count += 1;
      skillData.xpGained += Math.round(evaluation.score / 10); // 1 XP per 10 points
    });
  });

  // Update each skill
  for (const [skillName, data] of skillUpdates) {
    const averageScore = data.totalScore / data.count;
    const currentXP = data.xpGained;
    const currentLevel = Math.floor(currentXP / 100) + 1; // 100 XP per skill level

    const skillCategory = getSkillCategory(skillName);

    // Check if skill exists
    const { data: existingSkill } = await supabase
      .from('user_skills')
      .select('*')
      .eq('user_id', userId)
      .eq('skill_name', skillName)
      .single();

    const progressEntry = {
      date: new Date().toISOString(),
      xp_gained: currentXP,
      source: 'interview',
    };

    if (existingSkill) {
      // Update existing skill
      const newTotalXP = existingSkill.total_xp + currentXP;
      const newLevel = Math.floor(newTotalXP / 100) + 1;
      
      await supabase
        .from('user_skills')
        .update({
          current_level: newLevel,
          current_xp: newTotalXP % 100,
          total_xp: newTotalXP,
          progress_history: [...existingSkill.progress_history, progressEntry],
          last_updated: new Date().toISOString(),
        })
        .eq('id', existingSkill.id);
    } else {
      // Create new skill
      await supabase
        .from('user_skills')
        .insert([{
          user_id: userId,
          skill_name: skillName,
          skill_category: skillCategory,
          current_level: currentLevel,
          current_xp: currentXP,
          total_xp: currentXP,
          progress_history: [progressEntry],
        }]);
    }
  }
}

function getSkillCategory(skillName: string): string {
  const categories: { [key: string]: string } = {
    'Communication': 'soft-skills',
    'Technical Skills': 'technical',
    'Leadership': 'soft-skills',
    'Problem Solving': 'technical',
    'Emotional Intelligence': 'soft-skills',
  };
  
  return categories[skillName] || 'general';
}