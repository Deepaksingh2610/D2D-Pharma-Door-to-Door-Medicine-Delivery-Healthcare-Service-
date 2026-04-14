import nodemailer from "nodemailer";

export const sendOTPEmail = async (email, otp) => {
    // Log variable PRESENCE every time we try to send an email
    const emailStatus = process.env.EMAIL ? "PRESENT" : "MISSING";
    const passStatus = process.env.EMAIL_PASS ? "PRESENT" : "MISSING";
    console.log(`[Diagnostic] Attempting email send. Env Status: User=${emailStatus}, Pass=${passStatus}`);

    const transporter = nodemailer.createTransport({
        host: "smtp.googlemail.com", // Alternate host often better for cloud servers
        port: 465,
        secure: true, 
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASS,
        },
        family: 4, // Force IPv4
        connectionTimeout: 10000, // 10 seconds timeout
        greetingTimeout: 5000, 
    });

    const mailOptions = {
        from: `"D2D Pharma" <${process.env.EMAIL}>`,
        to: email,
        subject: "D2D Pharma - Your Verification Code",
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
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[Email Sent] OTP successfully sent to ${email}`);
        return true;
    } catch (error) {
        console.error("Critical Nodemailer Error:");
        console.error("- Recipient:", email);
        console.error("- Error Message:", error.message);
        console.error("- Error Code:", error.code);
        console.error("- Stack:", error.stack);
        return false;
    }
};
