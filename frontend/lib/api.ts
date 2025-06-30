import { supabase } from './supabase';

// API helper functions for frontend
export class APIClient {
  private static getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabase.auth.getSession().then(({ data }) => data.session?.access_token)}`
    };
  }

  static async startInterview(roleId: string, roleName: string) {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('/api/interviews/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ roleId, roleName })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to start interview');
    }

    return response.json();
  }

  static async submitResponse(sessionId: string, responseData: {
    questionId: string;
    questionText: string;
    questionCategory: string;
    questionDifficulty: number;
    responseText: string;
    audioUrl?: string;
    transcriptText?: string;
    responseTime: number;
  }) {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`/api/interviews/${sessionId}/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(responseData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit response');
    }

    return response.json();
  }

  static async completeInterview(sessionId: string, totalDuration: number) {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`/api/interviews/${sessionId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ totalDuration })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to complete interview');
    }

    return response.json();
  }

  static async getUserProfile() {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('/api/user/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch profile');
    }

    return response.json();
  }

  static async updateUserProfile(updates: { displayName?: string; preferences?: any }) {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update profile');
    }

    return response.json();
  }

  static async getUserStats() {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('/api/user/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch stats');
    }

    return response.json();
  }
}