// Function to safely get the origin URL
const getOrigin = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Fallback for server environment
  return process.env.NEXT_PUBLIC_APP_URL || 'https://zyra-app.vercel.app';
};

// Email service methods for client-side use
export const emailService = {
  /**
   * Send a team member invitation email
   */
  async sendTeamInvitation({
    projectName,
    projectId,
    memberName,
    memberEmail,
    inviterName,
    role
  }: {
    projectName: string;
    projectId: string;
    memberName: string;
    memberEmail: string;
    inviterName: string;
    role: string;
  }) {
    try {
      const origin = getOrigin();
      const projectUrl = `${origin}/project/${projectId}`;
      
      // Use fetch to call the API endpoint
      const response = await fetch('/api/email/send-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName,
          projectId,
          memberName,
          memberEmail,
          inviterName,
          role,
          projectUrl
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error sending invitation email:', data.error);
        return { success: false, error: data.error };
      }

      return { success: true, data };
    } catch (err) {
      console.error('Error sending invitation email:', err);
      return { success: false, error: err };
    }
  },

  /**
   * Send a welcome email to new users
   */
  async sendWelcomeEmail({
    name,
    email
  }: {
    name: string;
    email: string;
  }) {
    try {
      const origin = getOrigin();
      
      // Use fetch to call the API endpoint
      const response = await fetch('/api/email/send-welcome', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          appUrl: origin
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error sending welcome email:', data.error);
        return { success: false, error: data.error };
      }

      return { success: true, data };
    } catch (err) {
      console.error('Error sending welcome email:', err);
      return { success: false, error: err };
    }
  }
}; 