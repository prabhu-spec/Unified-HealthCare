/**
 * Email API – send welcome email when a user registers for the first time.
 */
import express from "express";
import { sendWelcomeEmail } from "../services/email.js";

const router = express.Router();
type Request = express.Request;
type Response = express.Response;

router.post("/api/email/welcome", async (req: Request, res: Response) => {
  const { email, firstName, lastName } = req.body || {};
  if (!email || !firstName || !lastName) {
    return res.status(400).json({
      success: false,
      error: "Email, firstName, and lastName are required.",
    });
  }
  const result = await sendWelcomeEmail({
    to: String(email).trim(),
    firstName: String(firstName).trim(),
    lastName: String(lastName).trim(),
  });
  if (!result.success) {
    return res.status(500).json({ success: false, error: result.error });
  }
  res.json({ success: true });
});

export default router;
