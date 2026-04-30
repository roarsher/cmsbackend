//  const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const Student = require("../models/Student");
// const Teacher = require("../models/Teacher");
// const Admin = require("../models/Admin");
// const Course = require("../models/Course");

// // 1. REGISTER CONTROLLER
// exports.register = async (req, res) => {
//   try {
//     const { name, email, password, role, ...profileData } = req.body;

//     if (!name || !email || !password || !role) {
//       return res.status(400).json({ success: false, message: "Missing core fields" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     if (role === "student") {
//       const existing = await Student.findOne({
//         $or: [{ email }, { rollNumber: profileData.rollNumber }],
//       });
//       if (existing)
//         return res.status(400).json({ success: false, message: "Email or Roll Number already exists" });

//       // ✅ Auto-assign courses based on department
//       const departmentCourses = await Course.find({
//         department: profileData.department,
//       }).select("_id");

//       const courseIds = departmentCourses.map((c) => c._id);

//       await Student.create({
//         name,
//         email,
//         password: hashedPassword,
//         role,
//         rollNumber: profileData.rollNumber,
//         department: profileData.department,
//         year: profileData.year,
//         courses: courseIds, // ✅ Assigned here
//       });

//       return res.status(201).json({
//         success: true,
//         message: `Student registered successfully! ${courseIds.length} courses assigned from ${profileData.department} department.`,
//       });
//     }

//     else if (role === "teacher") {
//       const existing = await Teacher.findOne({
//         $or: [{ email }, { TeacherIdNumber: profileData.TeacherIdNumber }],
//       });
//       if (existing)
//         return res.status(400).json({ success: false, message: "Email or Teacher ID already exists" });

//       await Teacher.create({
//         name,
//         email,
//         password: hashedPassword,
//         role,
//         TeacherIdNumber: profileData.TeacherIdNumber,
//         department: profileData.department,
//         designation: profileData.designation,
//       });

//       return res.status(201).json({
//         success: true,
//         message: "Teacher registered successfully!",
//       });
//     }

//     else if (role === "admin") {
//       const existing = await Admin.findOne({ email });
//       if (existing)
//         return res.status(400).json({ success: false, message: "Admin Email already exists" });

//       await Admin.create({
//         name,
//         email,
//         password: hashedPassword,
//         role,
//         adminId: profileData.adminId || `ADM-${Date.now()}`,
//       });

//       return res.status(201).json({
//         success: true,
//         message: "Admin registered successfully!",
//       });
//     }

//     return res.status(400).json({ success: false, message: "Invalid role" });

//   } catch (error) {
//     console.error("Registration Error:", error);
//     res.status(500).json({ success: false, message: "Server error", error: error.message });
//   }
// };

// // 2. LOGIN CONTROLLER
// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({ success: false, message: "Please provide both email and password" });
//     }

//     const [student, teacher, admin] = await Promise.all([
//       Student.findOne({ email }).select("+password"),
//       Teacher.findOne({ email }).select("+password"),
//       Admin.findOne({ email }).select("+password"),
//     ]);

//     let user = student || teacher || admin;

//     if (!user) {
//       return res.status(401).json({ success: false, message: "Invalid email or password" });
//     }

//     const isPasswordMatch = await bcrypt.compare(password, user.password);
//     if (!isPasswordMatch) {
//       return res.status(401).json({ success: false, message: "Invalid email or password" });
//     }

//     const token = jwt.sign(
//       { id: user._id, role: user.role },
//       process.env.JWT_SECRET || "your_temporary_secret_key",
//       { expiresIn: "24h" }
//     );

//     const userObject = user.toObject();
//     delete userObject.password;

//     res.status(200).json({
//       success: true,
//       message: "Login successful",
//       token,
//       user: userObject,
//     });

//   } catch (error) {
//     console.error("Login Error:", error);
//     res.status(500).json({ success: false, message: "Server error during login", error: error.message });
//   }
// };

// // 3. GET ME CONTROLLER
// exports.getMe = async (req, res) => {
//   try {
//     const token = req.headers.authorization?.split(" ")[1];
//     if (!token)
//       return res.status(401).json({ success: false, message: "No token provided" });

//     const decoded = jwt.verify(
//       token,
//       process.env.JWT_SECRET || "your_temporary_secret_key"
//     );

//     let user = null;

//     if (decoded.role === "student") {
//       user = await Student.findById(decoded.id).select("-password").populate("courses", "name code department");
//     } else if (decoded.role === "teacher") {
//       user = await Teacher.findById(decoded.id).select("-password");
//     } else if (decoded.role === "admin") {
//       user = await Admin.findById(decoded.id).select("-password");
//     }

//     if (!user)
//       return res.status(404).json({ success: false, message: "User not found" });

//     res.status(200).json({ success: true, user });

//   } catch (error) {
//     console.error("GetMe Error:", error);
//     res.status(401).json({ success: false, message: "Invalid or expired token" });
//   }
// };

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Admin = require("../models/Admin");
const Course = require("../models/Course");

// 1. REGISTER CONTROLLER
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, ...profileData } = req.body;

    if (!name || !email || !password || !role)
      return res.status(400).json({ success: false, message: "Missing core fields" });

    const hashedPassword = await bcrypt.hash(password, 10);

    if (role === "student") {
      const existing = await Student.findOne({
        $or: [
          { email },
          { rollNumber: profileData.rollNumber },
          { registrationNumber: profileData.registrationNumber },
        ],
      });
      if (existing)
        return res.status(400).json({
          success: false,
          message: "Email, Roll Number, or Registration Number already exists",
        });

      const { department, enrollmentYear, semester, rollSerial, regSerial } = profileData;

      if (!department || !enrollmentYear || !semester || !rollSerial || !regSerial)
        return res.status(400).json({
          success: false,
          message: "Missing fields: department, enrollmentYear, semester, rollSerial, regSerial required",
        });

      // ── Assign courses by BOTH department AND semester ──────────────
      const departmentCourses = await Course.find({
        department,
        semester: Number(semester),
      }).select("_id");

      const courseIds = departmentCourses.map((c) => c._id);

      const student = new Student({
        name,
        email,
        password: hashedPassword,
        role,
        department,
        enrollmentYear: Number(enrollmentYear),
        semester:       Number(semester),
        courses:        courseIds,
      });

      //student.assignNumbers(Number(rollSerial), Number(regSerial));
      student.rollNumber = "RN" + Date.now();
      student.year = Math.ceil(Number(semester || 1) / 2);
      await student.save();

      return res.status(201).json({
        success: true,
        message: `Student registered! ${courseIds.length} courses assigned for ${department} Semester ${semester}.`,
        rollNumber:         student.rollNumber,
        registrationNumber: student.registrationNumber,
        year:               student.year,
      });
    }

    else if (role === "teacher") {
      const existing = await Teacher.findOne({
        $or: [{ email }, { TeacherIdNumber: profileData.TeacherIdNumber }],
      });
      if (existing)
        return res.status(400).json({ success: false, message: "Email or Teacher ID already exists" });

      await Teacher.create({
        name, email,
        password: hashedPassword,
        role,
        TeacherIdNumber: profileData.TeacherIdNumber,
        department:      profileData.department,
        designation:     profileData.designation,
      });

      return res.status(201).json({ success: true, message: "Teacher registered successfully!" });
    }

    else if (role === "admin") {
      const existing = await Admin.findOne({ email });
      if (existing)
        return res.status(400).json({ success: false, message: "Admin Email already exists" });

      await Admin.create({
        name, email,
        password: hashedPassword,
        role,
        adminId: profileData.adminId || `ADM-${Date.now()}`,
      });

      return res.status(201).json({ success: true, message: "Admin registered successfully!" });
    }

    return res.status(400).json({ success: false, message: "Invalid role" });

  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// 2. LOGIN — unchanged
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: "Please provide email and password" });

    const [student, teacher, admin] = await Promise.all([
      Student.findOne({ email }).select("+password"),
      Teacher.findOne({ email }).select("+password"),
      Admin.findOne({ email }).select("+password"),
    ]);

    const user = student || teacher || admin;
    if (!user)
      return res.status(401).json({ success: false, message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: "Invalid email or password" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "your_temporary_secret_key",
      { expiresIn: "24h" }
    );

    const userObject = user.toObject();
    delete userObject.password;

    res.status(200).json({ success: true, message: "Login successful", token, user: userObject });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// 3. GET ME — unchanged
exports.getMe = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res.status(401).json({ success: false, message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_temporary_secret_key");

    let user = null;
    if (decoded.role === "student") {
      user = await Student.findById(decoded.id).select("-password").populate("courses", "name code department semester");
    } else if (decoded.role === "teacher") {
      user = await Teacher.findById(decoded.id).select("-password");
    } else if (decoded.role === "admin") {
      user = await Admin.findById(decoded.id).select("-password");
    }

    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, user });

  } catch (error) {
    console.error("GetMe Error:", error);
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};