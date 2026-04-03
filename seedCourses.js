 require("dotenv").config();
const mongoose = require("mongoose");
const Course = require("./models/Course");

const courses = [
  // ── CSE ──────────────────────────────────────────────────────────────────
  { name: "Data Structures & Algorithms", code: "CS101", department: "CSE" },
  { name: "Operating Systems",            code: "CS102", department: "CSE" },
  { name: "Database Management System",   code: "CS103", department: "CSE" },
  { name: "Computer Networks",            code: "CS104", department: "CSE" },
  { name: "Object Oriented Programming",  code: "CS105", department: "CSE" },
  { name: "Web Development",              code: "CS106", department: "CSE" },
  { name: "Machine Learning",             code: "CS107", department: "CSE" },
  { name: "Software Engineering",         code: "CS108", department: "CSE" },

  // ── ECE ──────────────────────────────────────────────────────────────────
  { name: "Digital Electronics",          code: "EC101", department: "ECE" },
  { name: "Signals & Systems",            code: "EC102", department: "ECE" },
  { name: "Microprocessors",              code: "EC103", department: "ECE" },
  { name: "Communication Systems",        code: "EC104", department: "ECE" },
  { name: "VLSI Design",                  code: "EC105", department: "ECE" },
  { name: "Embedded Systems",             code: "EC106", department: "ECE" },

  // ── ME ───────────────────────────────────────────────────────────────────
  { name: "Engineering Mechanics",        code: "ME101", department: "ME" },
  { name: "Thermodynamics",               code: "ME102", department: "ME" },
  { name: "Fluid Mechanics",              code: "ME103", department: "ME" },
  { name: "Manufacturing Processes",      code: "ME104", department: "ME" },
  { name: "Machine Design",               code: "ME105", department: "ME" },

  // ── CE ───────────────────────────────────────────────────────────────────
  { name: "Structural Analysis",          code: "CE101", department: "CE" },
  { name: "Soil Mechanics",               code: "CE102", department: "CE" },
  { name: "Fluid Mechanics & Hydraulics", code: "CE103", department: "CE" },
  { name: "Construction Technology",      code: "CE104", department: "CE" },
  { name: "Surveying",                    code: "CE105", department: "CE" },

  // ── EE ───────────────────────────────────────────────────────────────────
  { name: "Circuit Theory",               code: "EE101", department: "EE" },
  { name: "Electrical Machines",          code: "EE102", department: "EE" },
  { name: "Power Systems",                code: "EE103", department: "EE" },
  { name: "Control Systems",              code: "EE104", department: "EE" },
  { name: "Power Electronics",            code: "EE105", department: "EE" },
  { name: "Signals & Systems",            code: "EE106", department: "EE" },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    await Course.deleteMany({});
    console.log("🗑️  Cleared existing courses");

    const inserted = await Course.insertMany(courses);
    console.log(`🎉 Successfully seeded ${inserted.length} courses!`);

    const depts = [...new Set(courses.map(c => c.department))];
    depts.forEach(dept => {
      const count = courses.filter(c => c.department === dept).length;
      console.log(`   ${dept}: ${count} courses`);
    });

  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
};

seed();