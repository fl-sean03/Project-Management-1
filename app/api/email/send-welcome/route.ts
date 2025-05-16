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
      name,
      email,
      appUrl
    } = await request.json();

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Zyra <info@zyrapm.com>',
      to: email,
      subject: `Welcome to Zyra, ${name}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1e40af; margin-bottom: 16px;">Welcome to Zyra!</h2>
          <p>Hello ${name},</p>
          <p>Thank you for joining Zyra! We're excited to have you on board.</p>
          <p>Zyra is designed to help you manage your projects efficiently and collaborate with your team seamlessly.</p>
          <div style="margin: 24px 0;">
            <a href="${appUrl}/projects" style="background-color: #1e40af; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Get Started
            </a>
          </div>
          <p>If you have any questions or need assistance, feel free to contact our support team.</p>
          <p style="margin-top: 24px; color: #666; font-size: 14px;">
            The Zyra Team
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending welcome email:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('Unexpected error sending welcome email:', err);
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 