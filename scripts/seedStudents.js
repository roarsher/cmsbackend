 const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Student = require("../models/Student");
const Course = require("../models/Course");

require("dotenv").config();

const DEPARTMENTS = ["CSE", "ECE", "ME", "CE", "EE"];

const deptCodeMap = {
  CSE: 5,
  ECE: 4,
  ME: 3,
  CE: 2,
  EE: 1,
};

async function seedStudents() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // 🧹 clear old students
    // await Student.deleteMany();
    // console.log("🧹 Old students deleted");

    const hashedPassword = await bcrypt.hash("123456", 10);

    const enrollmentYear = 2023;
    const yy = String(enrollmentYear).slice(-2);

    let allStudents = [];

    for (const dept of DEPARTMENTS) {
      const dCode = deptCodeMap[dept];

      // 🎯 get semester 7 courses
      const courses = await Course.find({
        department: dept,
        semester: 7,
      });

      const courseIds = courses.map(c => c._id);

      for (let i = 1; i <= 50; i++) {
        const rollNumber = `${yy}${dCode}${String(i).padStart(2, "0")}`;
        const registrationNumber = `${yy}10${dCode}1080${String(i).padStart(2, "0")}`;

        allStudents.push({
          name: `st${dept.toLowerCase()}${i}`,
          email: `st${dept.toLowerCase()}${i}@gmail.com`,
          password:"kikiram",
          role: "student",

          department: dept,
          enrollmentYear,
          semester: 7,

          rollNumber,
          registrationNumber,

          courses: courseIds,
        });
      }
    }

    await Student.insertMany(allStudents);

    console.log(`🎓 ${allStudents.length} students inserted successfully!`);

  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected");
  }
}

seedStudents();