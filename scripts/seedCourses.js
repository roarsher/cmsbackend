 // scripts/seedCourses.js
// Run with: node scripts/seedCourses.js

const mongoose = require("mongoose");
const Course   = require("../models/Course"); // adjust path if needed
require("dotenv").config();

const COURSES = [
  // ─── CSE ────────────────────────────────────────────────────────────────
  // Semester 1
  { name: "Mathematics-I (Calculus & Linear Algebra)", code: "CSE-S1-01", department: "CSE", semester: 1 },
  { name: "Chemistry",                                  code: "CSE-S1-02", department: "CSE", semester: 1 },
  { name: "Programming for Problem Solving",            code: "CSE-S1-03", department: "CSE", semester: 1 },
  { name: "Workshop Manufacturing Practices",           code: "CSE-S1-04", department: "CSE", semester: 1 },
  { name: "English",                                    code: "CSE-S1-05", department: "CSE", semester: 1 },

  // Semester 2
  { name: "Mathematics-II (Probability and Statistics)", code: "CSE-S2-01", department: "CSE", semester: 2 },
  { name: "Physics (Semiconductor Physics)",             code: "CSE-S2-02", department: "CSE", semester: 2 },
  { name: "Basic Electrical Engineering",                code: "CSE-S2-03", department: "CSE", semester: 2 },
  { name: "Engineering Graphics & Design",               code: "CSE-S2-04", department: "CSE", semester: 2 },

  // Semester 3
  { name: "Data Structure & Algorithms",                 code: "CSE-S3-01", department: "CSE", semester: 3 },
  { name: "Object-Oriented Programming (C++/Java)",      code: "CSE-S3-02", department: "CSE", semester: 3 },
  { name: "Analog Electronic Circuits",                  code: "CSE-S3-03", department: "CSE", semester: 3 },
  { name: "Technical Writing",                           code: "CSE-S3-04", department: "CSE", semester: 3 },
  { name: "Mathematics-III (Differential Calculus)",     code: "CSE-S3-05", department: "CSE", semester: 3 },

  // Semester 4
  { name: "Operating Systems",                           code: "CSE-S4-01", department: "CSE", semester: 4 },
  { name: "Design & Analysis of Algorithms",             code: "CSE-S4-02", department: "CSE", semester: 4 },
  { name: "Digital Electronics",                         code: "CSE-S4-03", department: "CSE", semester: 4 },
  { name: "Computer Organization & Architecture",        code: "CSE-S4-04", department: "CSE", semester: 4 },
  { name: "Discrete Mathematics",                        code: "CSE-S4-05", department: "CSE", semester: 4 },

  // Semester 5
  { name: "Database Management Systems (DBMS)",          code: "CSE-S5-01", department: "CSE", semester: 5 },
  { name: "Artificial Intelligence",                     code: "CSE-S5-02", department: "CSE", semester: 5 },
  { name: "Software Engineering",                        code: "CSE-S5-03", department: "CSE", semester: 5 },
  { name: "Formal Language & Automata Theory",           code: "CSE-S5-04", department: "CSE", semester: 5 },
  { name: "Professional Skill Development",              code: "CSE-S5-05", department: "CSE", semester: 5 },

  // Semester 6
  { name: "Computer Networks",                           code: "CSE-S6-01", department: "CSE", semester: 6 },
  { name: "Compiler Design",                             code: "CSE-S6-02", department: "CSE", semester: 6 },
  { name: "Machine Learning",                            code: "CSE-S6-03", department: "CSE", semester: 6 },
  { name: "Advanced Java Programming",                   code: "CSE-S6-04", department: "CSE", semester: 6 },
  { name: "Speech and Audio Processing",                 code: "CSE-S6-05", department: "CSE", semester: 6 },

  // Semester 7
  { name: "Advanced Computer Architecture",              code: "CSE-S7-01", department: "CSE", semester: 7 },
  { name: "Internet of Things (IoT)",                    code: "CSE-S7-02", department: "CSE", semester: 7 },
  { name: "Biology for Engineers",                       code: "CSE-S7-03", department: "CSE", semester: 7 },
  { name: "Program Elective I",                          code: "CSE-S7-04", department: "CSE", semester: 7 },

  // Semester 8
  { name: "Data Mining",                                 code: "CSE-S8-01", department: "CSE", semester: 8 },
  { name: "Information Security",                        code: "CSE-S8-02", department: "CSE", semester: 8 },
  { name: "XML Web Services",                            code: "CSE-S8-03", department: "CSE", semester: 8 },
  { name: "Intrusion Detection Systems",                 code: "CSE-S8-04", department: "CSE", semester: 8 },

  // ─── ECE ────────────────────────────────────────────────────────────────
  { name: "Mathematics-I",                               code: "ECE-S1-01", department: "ECE", semester: 1 },
  { name: "Engineering Chemistry",                       code: "ECE-S1-02", department: "ECE", semester: 1 },
  { name: "Basic Electronics",                           code: "ECE-S1-03", department: "ECE", semester: 1 },
  { name: "English Communication",                       code: "ECE-S1-04", department: "ECE", semester: 1 },

  { name: "Mathematics-II",                              code: "ECE-S2-01", department: "ECE", semester: 2 },
  { name: "Physics",                                     code: "ECE-S2-02", department: "ECE", semester: 2 },
  { name: "Basic Electrical Engineering",                code: "ECE-S2-03", department: "ECE", semester: 2 },
  { name: "Engineering Graphics",                        code: "ECE-S2-04", department: "ECE", semester: 2 },

  { name: "Signals & Systems",                           code: "ECE-S3-01", department: "ECE", semester: 3 },
  { name: "Analog Electronic Circuits",                  code: "ECE-S3-02", department: "ECE", semester: 3 },
  { name: "Digital Electronics",                         code: "ECE-S3-03", department: "ECE", semester: 3 },
  { name: "Mathematics-III",                             code: "ECE-S3-04", department: "ECE", semester: 3 },

  { name: "Microprocessors & Microcontrollers",          code: "ECE-S4-01", department: "ECE", semester: 4 },
  { name: "Communication Systems",                       code: "ECE-S4-02", department: "ECE", semester: 4 },
  { name: "Electromagnetic Theory",                      code: "ECE-S4-03", department: "ECE", semester: 4 },
  { name: "Control Systems",                             code: "ECE-S4-04", department: "ECE", semester: 4 },

  { name: "VLSI Design",                                 code: "ECE-S5-01", department: "ECE", semester: 5 },
  { name: "Digital Signal Processing",                   code: "ECE-S5-02", department: "ECE", semester: 5 },
  { name: "Wireless Communication",                      code: "ECE-S5-03", department: "ECE", semester: 5 },
  { name: "Embedded Systems",                            code: "ECE-S5-04", department: "ECE", semester: 5 },

  { name: "Optical Fiber Communication",                 code: "ECE-S6-01", department: "ECE", semester: 6 },
  { name: "Antenna & Wave Propagation",                  code: "ECE-S6-02", department: "ECE", semester: 6 },
  { name: "Digital Image Processing",                    code: "ECE-S6-03", department: "ECE", semester: 6 },
  { name: "IoT & Sensor Networks",                       code: "ECE-S6-04", department: "ECE", semester: 6 },

  { name: "Advanced VLSI",                               code: "ECE-S7-01", department: "ECE", semester: 7 },
  { name: "5G Communication Technologies",               code: "ECE-S7-02", department: "ECE", semester: 7 },
  { name: "Robotics & Automation",                       code: "ECE-S7-03", department: "ECE", semester: 7 },

  { name: "Radar & Satellite Communication",             code: "ECE-S8-01", department: "ECE", semester: 8 },
  { name: "Medical Electronics",                         code: "ECE-S8-02", department: "ECE", semester: 8 },
  { name: "ECE Elective",                                code: "ECE-S8-03", department: "ECE", semester: 8 },

  // ─── ME ─────────────────────────────────────────────────────────────────
  { name: "Mathematics-I",                               code: "ME-S1-01",  department: "ME",  semester: 1 },
  { name: "Engineering Chemistry",                       code: "ME-S1-02",  department: "ME",  semester: 1 },
  { name: "Workshop Practices",                          code: "ME-S1-03",  department: "ME",  semester: 1 },
  { name: "English",                                     code: "ME-S1-04",  department: "ME",  semester: 1 },

  { name: "Mathematics-II",                              code: "ME-S2-01",  department: "ME",  semester: 2 },
  { name: "Engineering Physics",                         code: "ME-S2-02",  department: "ME",  semester: 2 },
  { name: "Engineering Graphics",                        code: "ME-S2-03",  department: "ME",  semester: 2 },
  { name: "Basic Electrical & Electronics",              code: "ME-S2-04",  department: "ME",  semester: 2 },

  { name: "Engineering Mechanics",                       code: "ME-S3-01",  department: "ME",  semester: 3 },
  { name: "Thermodynamics",                              code: "ME-S3-02",  department: "ME",  semester: 3 },
  { name: "Material Science",                            code: "ME-S3-03",  department: "ME",  semester: 3 },
  { name: "Mathematics-III",                             code: "ME-S3-04",  department: "ME",  semester: 3 },

  { name: "Fluid Mechanics",                             code: "ME-S4-01",  department: "ME",  semester: 4 },
  { name: "Manufacturing Processes",                     code: "ME-S4-02",  department: "ME",  semester: 4 },
  { name: "Strength of Materials",                       code: "ME-S4-03",  department: "ME",  semester: 4 },
  { name: "Kinematics of Machines",                      code: "ME-S4-04",  department: "ME",  semester: 4 },

  { name: "Heat & Mass Transfer",                        code: "ME-S5-01",  department: "ME",  semester: 5 },
  { name: "Machine Design",                              code: "ME-S5-02",  department: "ME",  semester: 5 },
  { name: "Dynamics of Machines",                        code: "ME-S5-03",  department: "ME",  semester: 5 },
  { name: "Metrology & Quality Control",                 code: "ME-S5-04",  department: "ME",  semester: 5 },

  { name: "CAD/CAM",                                     code: "ME-S6-01",  department: "ME",  semester: 6 },
  { name: "Industrial Engineering",                      code: "ME-S6-02",  department: "ME",  semester: 6 },
  { name: "Refrigeration & Air Conditioning",            code: "ME-S6-03",  department: "ME",  semester: 6 },
  { name: "Finite Element Methods",                      code: "ME-S6-04",  department: "ME",  semester: 6 },

  { name: "Power Plant Engineering",                     code: "ME-S7-01",  department: "ME",  semester: 7 },
  { name: "Automobile Engineering",                      code: "ME-S7-02",  department: "ME",  semester: 7 },
  { name: "ME Elective I",                               code: "ME-S7-03",  department: "ME",  semester: 7 },

  { name: "Robotics",                                    code: "ME-S8-01",  department: "ME",  semester: 8 },
  { name: "Non-Conventional Energy Systems",             code: "ME-S8-02",  department: "ME",  semester: 8 },
  { name: "ME Elective II",                              code: "ME-S8-03",  department: "ME",  semester: 8 },

  // ─── CE ─────────────────────────────────────────────────────────────────
  { name: "Mathematics-I",                               code: "CE-S1-01",  department: "CE",  semester: 1 },
  { name: "Engineering Chemistry",                       code: "CE-S1-02",  department: "CE",  semester: 1 },
  { name: "Engineering Graphics",                        code: "CE-S1-03",  department: "CE",  semester: 1 },
  { name: "English",                                     code: "CE-S1-04",  department: "CE",  semester: 1 },

  { name: "Mathematics-II",                              code: "CE-S2-01",  department: "CE",  semester: 2 },
  { name: "Engineering Physics",                         code: "CE-S2-02",  department: "CE",  semester: 2 },
  { name: "Basic Electrical Engineering",                code: "CE-S2-03",  department: "CE",  semester: 2 },
  { name: "Workshop Practices",                          code: "CE-S2-04",  department: "CE",  semester: 2 },

  { name: "Structural Analysis-I",                       code: "CE-S3-01",  department: "CE",  semester: 3 },
  { name: "Strength of Materials",                       code: "CE-S3-02",  department: "CE",  semester: 3 },
  { name: "Fluid Mechanics",                             code: "CE-S3-03",  department: "CE",  semester: 3 },
  { name: "Mathematics-III",                             code: "CE-S3-04",  department: "CE",  semester: 3 },

  { name: "Structural Analysis-II",                      code: "CE-S4-01",  department: "CE",  semester: 4 },
  { name: "Soil Mechanics",                              code: "CE-S4-02",  department: "CE",  semester: 4 },
  { name: "Surveying",                                   code: "CE-S4-03",  department: "CE",  semester: 4 },
  { name: "Construction Materials",                      code: "CE-S4-04",  department: "CE",  semester: 4 },

  { name: "RCC Design",                                  code: "CE-S5-01",  department: "CE",  semester: 5 },
  { name: "Transportation Engineering",                  code: "CE-S5-02",  department: "CE",  semester: 5 },
  { name: "Hydraulics & Hydraulic Machines",             code: "CE-S5-03",  department: "CE",  semester: 5 },
  { name: "Environmental Engineering",                   code: "CE-S5-04",  department: "CE",  semester: 5 },

  { name: "Foundation Engineering",                      code: "CE-S6-01",  department: "CE",  semester: 6 },
  { name: "Steel Structure Design",                      code: "CE-S6-02",  department: "CE",  semester: 6 },
  { name: "Water Resources Engineering",                 code: "CE-S6-03",  department: "CE",  semester: 6 },
  { name: "Construction Technology & Management",        code: "CE-S6-04",  department: "CE",  semester: 6 },

  { name: "Advanced Structural Analysis",                code: "CE-S7-01",  department: "CE",  semester: 7 },
  { name: "Earthquake Engineering",                      code: "CE-S7-02",  department: "CE",  semester: 7 },
  { name: "CE Elective I",                               code: "CE-S7-03",  department: "CE",  semester: 7 },

  { name: "Project Management",                          code: "CE-S8-01",  department: "CE",  semester: 8 },
  { name: "Remote Sensing & GIS",                        code: "CE-S8-02",  department: "CE",  semester: 8 },
  { name: "CE Elective II",                              code: "CE-S8-03",  department: "CE",  semester: 8 },

  // ─── EE ─────────────────────────────────────────────────────────────────
  { name: "Mathematics-I",                               code: "EE-S1-01",  department: "EE",  semester: 1 },
  { name: "Engineering Chemistry",                       code: "EE-S1-02",  department: "EE",  semester: 1 },
  { name: "Basic Electronics",                           code: "EE-S1-03",  department: "EE",  semester: 1 },
  { name: "English",                                     code: "EE-S1-04",  department: "EE",  semester: 1 },

  { name: "Mathematics-II",                              code: "EE-S2-01",  department: "EE",  semester: 2 },
  { name: "Engineering Physics",                         code: "EE-S2-02",  department: "EE",  semester: 2 },
  { name: "Circuit Theory",                              code: "EE-S2-03",  department: "EE",  semester: 2 },
  { name: "Engineering Graphics",                        code: "EE-S2-04",  department: "EE",  semester: 2 },

  { name: "Electrical Machines-I",                       code: "EE-S3-01",  department: "EE",  semester: 3 },
  { name: "Signals & Systems",                           code: "EE-S3-02",  department: "EE",  semester: 3 },
  { name: "Digital Electronics",                         code: "EE-S3-03",  department: "EE",  semester: 3 },
  { name: "Mathematics-III",                             code: "EE-S3-04",  department: "EE",  semester: 3 },

  { name: "Electrical Machines-II",                      code: "EE-S4-01",  department: "EE",  semester: 4 },
  { name: "Power Systems-I",                             code: "EE-S4-02",  department: "EE",  semester: 4 },
  { name: "Control Systems",                             code: "EE-S4-03",  department: "EE",  semester: 4 },
  { name: "Electromagnetic Fields",                      code: "EE-S4-04",  department: "EE",  semester: 4 },

  { name: "Power Systems-II",                            code: "EE-S5-01",  department: "EE",  semester: 5 },
  { name: "Power Electronics",                           code: "EE-S5-02",  department: "EE",  semester: 5 },
  { name: "Microprocessors",                             code: "EE-S5-03",  department: "EE",  semester: 5 },
  { name: "Instrumentation & Measurement",               code: "EE-S5-04",  department: "EE",  semester: 5 },

  { name: "High Voltage Engineering",                    code: "EE-S6-01",  department: "EE",  semester: 6 },
  { name: "Electric Drives",                             code: "EE-S6-02",  department: "EE",  semester: 6 },
  { name: "Switchgear & Protection",                     code: "EE-S6-03",  department: "EE",  semester: 6 },
  { name: "Renewable Energy Systems",                    code: "EE-S6-04",  department: "EE",  semester: 6 },

  { name: "Smart Grid Technology",                       code: "EE-S7-01",  department: "EE",  semester: 7 },
  { name: "FACTS & HVDC",                                code: "EE-S7-02",  department: "EE",  semester: 7 },
  { name: "EE Elective I",                               code: "EE-S7-03",  department: "EE",  semester: 7 },

  { name: "Energy Audit & Management",                   code: "EE-S8-01",  department: "EE",  semester: 8 },
  { name: "Electric Vehicles",                           code: "EE-S8-02",  department: "EE",  semester: 8 },
  { name: "EE Elective II",                              code: "EE-S8-03",  department: "EE",  semester: 8 },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    let inserted = 0;
    let skipped  = 0;

    for (const course of COURSES) {
      const exists = await Course.findOne({ code: course.code });
      if (exists) {
        skipped++;
        continue;
      }
      await Course.create(course);
      inserted++;
    }

    console.log(`\n🎓 Seeding complete!`);
    console.log(`   ✅ Inserted : ${inserted}`);
    console.log(`   ⏭️  Skipped  : ${skipped} (already existed)`);
    console.log(`   📦 Total    : ${COURSES.length}`);

    // Summary by department
    const depts = ["CSE", "ECE", "ME", "CE", "EE"];
    for (const dept of depts) {
      const count = await Course.countDocuments({ department: dept });
      console.log(`   ${dept}: ${count} courses in DB`);
    }

  } catch (err) {
    console.error("❌ Seed error:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected");
  }
}

seed();