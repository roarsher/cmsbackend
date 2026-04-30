const admin   = require("firebase-admin");
const jwt     = require("jsonwebtoken");
const bcrypt  = require("bcryptjs");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Admin   = require("../models/Admin");
const Course  = require("../models/Course");

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const findUser = async (email) => {
  const [s, t, a] = await Promise.all([
    Student.findOne({ email }).select("-password"),
    Teacher.findOne({ email }).select("-password"),
    Admin.findOne({ email }).select("-password"),
  ]);
  return s || t || a;
};

const makeJWT = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || "secret",
    { expiresIn: "24h" }
  );

// ✅ Verify Firebase token + auto-login or register
exports.firebaseAuth = async (req, res) => {
  try {
    const { idToken, role, extraData } = req.body;
    if (!idToken) return res.status(400).json({ message: "Firebase token required" });

    // Verify Firebase token
    const decoded = await admin.auth().verifyIdToken(idToken);

    if (!decoded.email_verified) {
      return res.status(401).json({ message: "Email not verified. Please verify your email first." });
    }

    const { email, name, uid } = decoded;

    // Check if user already exists in MongoDB
    let user = await findUser(email);

    if (user) {
      // Existing user → auto-login
      const token = makeJWT(user);
      return res.json({ success: true, token, user, isNew: false });
    }

    // New user via Google (email signup flow handles its own registration)
    // For Google sign-in, create a basic student record or require role selection
    if (!role) {
      return res.status(200).json({
        success: true,
        isNew:   true,
        email,
        name,
        uid,
        message: "New user — role selection required",
      });
    }

    // Create new user with role + extraData
    const hashedPassword = await bcrypt.hash(uid, 10); // use Firebase UID as password hash

    if (role === "student") {
      const courses = await Course.find({ department: extraData?.department }).select("_id");
      user = await Student.create({
        name:       name || extraData?.name,
        email,
        password:   hashedPassword,
        role:       "student",
        rollNumber: extraData?.rollNumber || "",
        department: extraData?.department || "CSE",
        year:       Number(extraData?.year) || 1,
        courses:    courses.map(c => c._id),
      });
    } else if (role === "teacher") {
      user = await Teacher.create({
        name:            name || extraData?.name,
        email,
        password:        hashedPassword,
        role:            "teacher",
        TeacherIdNumber: extraData?.TeacherIdNumber || "",
        department:      extraData?.department || "CSE",
        designation:     extraData?.designation || "Assistant Professor",
      });
    } else if (role === "admin") {
      user = await Admin.create({
        name:    name || extraData?.name,
        email,
        password: hashedPassword,
        role:    "admin",
        adminId: `ADM-${Date.now()}`,
      });
    }

    const token = makeJWT(user);
    res.status(201).json({ success: true, token, user, isNew: true });

  } catch (error) {
    console.error("firebaseAuth error:", error.message);
    res.status(500).json({ message: error.message || "Authentication failed" });
  }
};