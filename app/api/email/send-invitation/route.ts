import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    // Get API key from environment variable
    const resendApiKey = process.env.RESEND_API_KEY;
    
    // Check if Resend API key is configured
    if (!resendApiKey) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    // Initialize Resend with API key
    const resend = new Resend(resendApiKey);

    // Parse request body
    const {
      projectName,
      memberName,
      memberEmail,
      inviterName,
      role,
      projectUrl
    } = await request.json();

    // Validate required fields
    if (!projectName || !memberName || !memberEmail || !role || !projectUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Zyra <info@zyrapm.com>',
      to: memberEmail,
      subject: `You've been invited to join ${projectName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1e40af; margin-bottom: 16px;">Team Invitation</h2>
          <p>Hello ${memberName},</p>
          <p><strong>${inviterName || 'A team member'}</strong> has invited you to join <strong>${projectName}</strong> as a <strong>${role}</strong>.</p>
          <div style="margin: 24px 0;">
            <a href="${projectUrl}" style="background-color: #1e40af; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
              View Project
            </a>
          </div>
          <p>You can access this project by logging into your Zyra account.</p>
          <p style="margin-top: 24px; color: #666; font-size: 14px;">
            This is an automated message, please do not reply to this email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending invitation email:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('Unexpected error sending invitation email:', err);
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 