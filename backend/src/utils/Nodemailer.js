import { Resend } from 'resend';

// Initializing Resend with API Key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOTPEmail = async (email, otp) => {
    // Log variable PRESENCE
    const apiKeyStatus = process.env.RESEND_API_KEY ? "PRESENT" : "MISSING";
    console.log(`[Diagnostic] Resend Attempt. API Key Status: ${apiKeyStatus}`);

    try {
        const { data, error } = await resend.emails.send({
            from: 'D2D Pharma <onboarding@resend.dev>', // Use verified domain later if available
            to: [email],
            subject: 'D2D Pharma - Your Verification Code',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #2e7d32; text-align: center;">D2D Pharma Verification</h2>
                    <p>Hello,</p>
                    <p>You are receiving this email because you're signing up for D2D Pharma. Your verification code is:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1565c0; background: #e3f2fd; padding: 10px 20px; border-radius: 5px;">${otp}</span>
                    </div>
                    <p>This code is valid for <strong>5 minutes</strong>. If you did not request this, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #999999; text-align: center;">© 2026 D2D Pharma Service. All rights reserved.</p>
                </div>
            `,
        });

        if (error) {
            console.error("Resend API Error:", error.message);
            return false;
        }

        console.log(`[Email Sent] Resend ID: ${data.id}. OTP sent to ${email}`);
        return true;
    } catch (error) {
        console.error("Critical Resend Failure:");
        console.error("- Recipient:", email);
        console.error("- Error Message:", error.message);
        return false;
    }
};
