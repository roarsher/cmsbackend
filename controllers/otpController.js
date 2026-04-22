const { Resend } = require("resend");
const crypto     = require("crypto");
const Student    = require("../models/Student");
const Teacher    = require("../models/Teacher");
const Admin      = require("../models/Admin");
const bcrypt     = require("bcryptjs");
const jwt        = require("jsonwebtoken");

const resend = new Resend(process.env.RESEND_API_KEY);

// In-memory OTP store { email: { otp, expiresAt, attempts } }
const otpStore = new Map();

const findUser = async (email) => {
  const [s, t, a] = await Promise.all([
    Student.findOne({ email }).select("+password"),
    Teacher.findOne({ email }).select("+password"),
    Admin.findOne({ email }).select("+password"),
  ]);
  return s || t || a;
};

// ✅ Step 1 — Send OTP
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await findUser(email);
    if (!user) return res.status(404).json({ message: "No account found with this email" });

    // Rate limit — max 3 OTPs per 10 min
    const existing = otpStore.get(email);
    if (existing && existing.attempts >= 3 && existing.expiresAt > Date.now()) {
      const wait = Math.ceil((existing.expiresAt - Date.now()) / 60000);
      return res.status(429).json({ message: `Too many attempts. Try again in ${wait} min.` });
    }

    const otp       = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(email, {
      otp,
      expiresAt,
      attempts: (existing?.attempts || 0) + 1,
      userId:   user._id,
      role:     user.role,
    });

    // Send email via Resend
    await resend.emails.send({
      from:    "BCE CMS <noreply@yourdomain.com>", // replace with your verified domain
      to:      email,
      subject: "🔐 Your Login OTP — BCE Bhagalpur ERP",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:16px">
          <div style="text-align:center;margin-bottom:24px">
            <h1 style="margin:0;font-size:24px;color:#1e293b">BCE BHAGALPUR</h1>
            <p style="color:#64748b;font-size:14px;margin-top:4px">Smart College Management System</p>
          </div>
          <div style="background:white;border-radius:12px;padding:28px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.08)">
            <p style="color:#64748b;font-size:14px;margin:0 0 16px">Hello <strong>${user.name}</strong>, your login OTP is:</p>
            <div style="background:#1e293b;color:#facc15;font-size:40px;font-weight:900;letter-spacing:12px;padding:20px 32px;border-radius:12px;display:inline-block;margin:8px 0">
              ${otp}
            </div>
            <p style="color:#94a3b8;font-size:13px;margin:16px 0 0">Valid for <strong>10 minutes</strong>. Do not share this OTP with anyone.</p>
          </div>
          <p style="color:#cbd5e1;font-size:12px;text-align:center;margin-top:20px">
            If you did not request this, please ignore this email.<br/>
            © ${new Date().getFullYear()} BCE Bhagalpur ERP
          </p>
        </div>
      `,
    });

    res.json({ success: true, message: `OTP sent to ${email.replace(/(.{2}).*(@.*)/, "$1***$2")}` });
  } catch (error) {
    console.error("sendOTP error:", error);
    res.status(500).json({ message: "Failed to send OTP. Try again." });
  }
};

// ✅ Step 2 — Verify OTP & Login
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

    const record = otpStore.get(email);
    if (!record)                      return res.status(400).json({ message: "No OTP requested for this email" });
    if (Date.now() > record.expiresAt) return res.status(400).json({ message: "OTP expired. Request a new one." });
    if (record.otp !== otp.toString()) return res.status(400).json({ message: "Invalid OTP. Check your email." });

    // Clear OTP after success
    otpStore.delete(email);

    const user = await findUser(email);
    if (!user) return res.status(404).json({ message: "User not found" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "24h" }
    );

    const userObj = user.toObject();
    delete userObj.password;

    res.json({ success: true, message: "Login successful", token, user: userObj });
  } catch (error) {
    console.error("verifyOTP error:", error);
    res.status(500).json({ message: "Verification failed" });
  }
};