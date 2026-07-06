/**
 * SendGrid email service – welcome email on first-time registration.
 * Works on both localhost and AWS: SendGrid sends via their API over the internet,
 * so as long as the backend can make outbound HTTPS requests, emails are delivered.
 */
import sgMail from "@sendgrid/mail";

const FROM_EMAIL = "noreply@acentle.com";
const FROM_NAME = "Healthcare Platform";

export function initSendGrid(): void {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (apiKey) {
    sgMail.setApiKey(apiKey);
  }
}

export async function sendWelcomeEmail(params: {
  to: string;
  firstName: string;
  lastName: string;
}): Promise<{ success: boolean; error?: string }> {
  const { to, firstName, lastName } = params;
  if (!process.env.SENDGRID_API_KEY) {
    return { success: false, error: "SendGrid is not configured" };
  }
  const msg = {
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: "Welcome to the Healthcare Platform",
    text: `Hello ${firstName} ${lastName},\n\nThank you for registering. You can now sign in and use your dashboard.\n\nBest regards,\nHealthcare Platform`,
    html: `<strong>Hello ${firstName} ${lastName},</strong><p>Thank you for registering. You can now sign in and use your dashboard.</p><p>Best regards,<br/>Healthcare Platform</p>`,
  };
  try {
    await sgMail.send(msg);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "SendGrid error";
    console.error("SendGrid send failed:", message);
    return { success: false, error: String(message) };
  }
}

/** OTP validity in seconds */
const OTP_EXPIRY_SEC = 600; // 10 minutes

export async function sendPasswordResetOTP(params: {
  to: string;
  otp: string;
  firstName?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { to, otp, firstName } = params;
  if (!process.env.SENDGRID_API_KEY) {
    return { success: false, error: "SendGrid is not configured" };
  }
  const name = firstName || "User";
  const msg = {
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: "Password reset – Healthcare Platform",
    text: `Hello ${name},\n\nYour one-time code to reset your password is: ${otp}\n\nThis code expires in ${OTP_EXPIRY_SEC / 60} minutes. If you did not request this, please ignore this email.\n\nBest regards,\nHealthcare Platform`,
    html: `<strong>Hello ${name},</strong><p>Your one-time code to reset your password is: <strong style="font-size:1.2em;letter-spacing:2px;">${otp}</strong></p><p>This code expires in ${OTP_EXPIRY_SEC / 60} minutes. If you did not request this, please ignore this email.</p><p>Best regards,<br/>Healthcare Platform</p>`,
  };
  try {
    await sgMail.send(msg);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "SendGrid error";
    console.error("SendGrid send failed:", message);
    return { success: false, error: String(message) };
  }
}

export async function sendPasswordChangeOTP(params: {
  to: string;
  otp: string;
  firstName?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { to, otp, firstName } = params;
  if (!process.env.SENDGRID_API_KEY) {
    return { success: false, error: "SendGrid is not configured" };
  }
  const name = firstName || "User";
  const msg = {
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: "Confirm password change – Healthcare Platform",
    text: `Hello ${name},\n\nYour one-time code to change your password is: ${otp}\n\nThis code expires in ${OTP_EXPIRY_SEC / 60} minutes. If you did not request this, please secure your account.\n\nBest regards,\nHealthcare Platform`,
    html: `<strong>Hello ${name},</strong><p>Your one-time code to change your password is: <strong style="font-size:1.2em;letter-spacing:2px;">${otp}</strong></p><p>This code expires in ${OTP_EXPIRY_SEC / 60} minutes. If you did not request this, please secure your account.</p><p>Best regards,<br/>Healthcare Platform</p>`,
  };
  try {
    await sgMail.send(msg);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "SendGrid error";
    console.error("SendGrid send failed:", message);
    return { success: false, error: String(message) };
  }
}

export async function sendDeleteAccountOTP(params: {
  to: string;
  otp: string;
  firstName?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { to, otp, firstName } = params;
  if (!process.env.SENDGRID_API_KEY) {
    return { success: false, error: "SendGrid is not configured" };
  }
  const name = firstName || "User";
  const msg = {
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: "Confirm account deletion – Healthcare Platform",
    text: `Hello ${name},\n\nYour one-time code to permanently delete your account is: ${otp}\n\nThis code expires in ${OTP_EXPIRY_SEC / 60} minutes. After deletion, your data cannot be recovered.\n\nIf you did not request this, please ignore this email and secure your account.\n\nBest regards,\nHealthcare Platform`,
    html: `<strong>Hello ${name},</strong><p>Your one-time code to permanently delete your account is: <strong style="font-size:1.2em;letter-spacing:2px;">${otp}</strong></p><p>This code expires in ${OTP_EXPIRY_SEC / 60} minutes. After deletion, your data cannot be recovered.</p><p>If you did not request this, please ignore this email and secure your account.</p><p>Best regards,<br/>Healthcare Platform</p>`,
  };
  try {
    await sgMail.send(msg);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "SendGrid error";
    console.error("SendGrid send failed:", message);
    return { success: false, error: String(message) };
  }
}

export async function sendEmailReminder(params: {
  to: string;
  loginEmail: string;
  firstName?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { to, loginEmail, firstName } = params;
  if (!process.env.SENDGRID_API_KEY) {
    return { success: false, error: "SendGrid is not configured" };
  }
  const name = firstName || "User";
  const msg = {
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: "Your login email – Healthcare Platform",
    text: `Hello ${name},\n\nYour login email for the Healthcare Platform is: ${loginEmail}\n\nUse this email to sign in.\n\nBest regards,\nHealthcare Platform`,
    html: `<strong>Hello ${name},</strong><p>Your login email for the Healthcare Platform is: <strong>${loginEmail}</strong></p><p>Use this email to sign in.</p><p>Best regards,<br/>Healthcare Platform</p>`,
  };
  try {
    await sgMail.send(msg);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "SendGrid error";
    console.error("SendGrid send failed:", message);
    return { success: false, error: String(message) };
  }
}

export async function sendAccountChangeNotification(params: {
  to: string;
  changeType: "password_changed" | "email_changed" | "account_deleted";
  firstName?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { to, changeType, firstName } = params;
  if (!process.env.SENDGRID_API_KEY) {
    return { success: false, error: "SendGrid is not configured" };
  }
  const name = firstName || "User";
  const [subject, textPart] =
    changeType === "password_changed"
      ? ["Your password was changed – Healthcare Platform", "Your password has been changed successfully. If you did not make this change, please contact support immediately."]
      : changeType === "email_changed"
        ? ["Your email was updated – Healthcare Platform", "Your account email has been updated. Use your new email to sign in."]
        : ["Your account was deleted – Healthcare Platform", "Your account has been permanently deleted. You can register again anytime if you wish to use the platform."];
  const msg = {
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject,
    text: `Hello ${name},\n\n${textPart}\n\nBest regards,\nHealthcare Platform`,
    html: `<strong>Hello ${name},</strong><p>${textPart}</p><p>Best regards,<br/>Healthcare Platform</p>`,
  };
  try {
    await sgMail.send(msg);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "SendGrid error";
    console.error("SendGrid send failed:", message);
    return { success: false, error: String(message) };
  }
}
