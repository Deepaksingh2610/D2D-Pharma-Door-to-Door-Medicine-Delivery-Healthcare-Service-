import * as Brevo from '@getbrevo/brevo';

// Initializing the Brevo API Client
const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

export const sendOTPEmail = async (email, otp) => {
    // Log variable PRESENCE
    const apiKeyStatus = process.env.BREVO_API_KEY ? "PRESENT" : "MISSING";
    const senderStatus = process.env.BREVO_SENDER_EMAIL ? "PRESENT" : "MISSING";
    console.log(`[Diagnostic] Brevo Attempt. API Key: ${apiKeyStatus}, Sender: ${senderStatus}`);

    const sendSmtpEmail = new Brevo.SendSmtpEmail();

    sendSmtpEmail.subject = "D2D Pharma - Your Verification Code";
    sendSmtpEmail.htmlContent = `
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
    `;
    sendSmtpEmail.sender = { "name": "D2D Pharma", "email": process.env.BREVO_SENDER_EMAIL };
    sendSmtpEmail.to = [{ "email": email }];

    try {
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log(`[Email Sent] Brevo Success! Message ID: ${data.messageId}`);
        return true;
    } catch (error) {
        console.error("Critical Brevo Failure:");
        console.error("- Recipient:", email);
        console.error("- Error Details:", error.response ? error.response.body : error.message);
        return false;
    }
};
