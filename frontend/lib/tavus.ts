// Tavus AI API integration
export interface TavusConfig {
  apiKey: string;
  baseUrl: string;
}

export interface TavusPersona {
  id: string;
  name: string;
  description: string;
  replicaId: string;
}

export interface TavusContext {
  user_name: string;
  role: string;
  interview_type: string;
  goals: string[];
  experience_level?: string;
}

export interface TavusSession {
  session_id: string;
  stream_url?: string;
  status: 'starting' | 'active' | 'ended';
}

export class TavusClient {
  private config: TavusConfig;

  constructor(config: TavusConfig) {
    this.config = config;
  }

  async startPersonaSession(
    personaId: string, 
    replicaId: string, 
    context: TavusContext
  ): Promise<TavusSession> {
    try {
      const response = await fetch(`${this.config.baseUrl}/personas/${personaId}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.config.apiKey
        },
        body: JSON.stringify({
          replica_id: replicaId,
          context
        })
      });

      if (!response.ok) {
        throw new Error(`Tavus API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("🎤 Tavus session started:", data);
      
      return {
        session_id: data.session_id || data.id,
        stream_url: data.stream_url || data.url,
        status: 'starting'
      };
    } catch (error) {
      console.error("❌ Tavus error:", error);
      throw error;
    }
  }

  async endSession(sessionId: string): Promise<void> {
    try {
      const response = await fetch(`${this.config.baseUrl}/sessions/${sessionId}/end`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.config.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to end Tavus session: ${response.status}`);
      }

      console.log("🎤 Tavus session ended");
    } catch (error) {
      console.error("❌ Error ending Tavus session:", error);
      throw error;
    }
  }

  async sendMessage(sessionId: string, message: string): Promise<void> {
    try {
      const response = await fetch(`${this.config.baseUrl}/sessions/${sessionId}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.config.apiKey
        },
        body: JSON.stringify({ message })
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }
    } catch (error) {
      console.error("❌ Error sending message to Tavus:", error);
      throw error;
    }
  }
}

// Default Tavus configuration
export const tavusConfig: TavusConfig = {
  apiKey: process.env.NEXT_PUBLIC_TAVUS_API_KEY || "ad5d3448d9d24478b8d2175b9b4a821e",
  baseUrl: process.env.NEXT_PUBLIC_TAVUS_BASE_URL || "https://api.tavus.io/v2"
};

// Predefined personas for different interview types
export const tavusPersonas: Record<string, TavusPersona> = {
  'frontend-developer': {
    id: 'p2e3bf82d71f',
    name: 'Eric - Frontend Expert',
    description: 'Senior Frontend Developer with expertise in React, JavaScript, and modern web technologies',
    replicaId: 're10607e3db7'
  },
  'backend-developer': {
    id: 'p2e3bf82d71f',
    name: 'Eric - Backend Specialist',
    description: 'Principal Backend Engineer focused on scalability and system architecture',
    replicaId: 're10607e3db7'
  },
  'data-analyst': {
    id: 'p2e3bf82d71f',
    name: 'Eric - Data Expert',
    description: 'Senior Data Scientist with expertise in analytics and machine learning',
    replicaId: 're10607e3db7'
  },
  'product-manager': {
    id: 'p2e3bf82d71f',
    name: 'Eric - Product Leader',
    description: 'VP of Product with experience in strategy and execution',
    replicaId: 're10607e3db7'
  },
  'ux-designer': {
    id: 'p2e3bf82d71f',
    name: 'Eric - Design Director',
    description: 'Creative leader focused on user-centered design and design thinking',
    replicaId: 're10607e3db7'
  },
  'devops-engineer': {
    id: 'p2e3bf82d71f',
    name: 'Eric - DevOps Lead',
    description: 'Infrastructure expert specializing in CI/CD and cloud technologies',
    replicaId: 're10607e3db7'
  }
};

// Create Tavus client instance
export const tavusClient = new TavusClient(tavusConfig);