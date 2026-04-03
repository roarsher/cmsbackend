 const { GoogleGenAI } = require("@google/genai");
const Student    = require("../models/Student");
const Marks      = require("../models/Marks");
const Attendance = require("../models/Attendance");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

exports.generatePerformanceReport = async (req, res) => {
  try {
    // ✅ Fetch students (no populate - marks not in Student schema)
    const students = await Student.find().select("-password");

    // ✅ For each student, fetch their marks and attendance separately
    const formattedData = await Promise.all(
      students.map(async (s) => {
        const marks = await Marks.find({ student: s._id })
          .populate("course", "name code");

        const attendance = await Attendance.find({ student: s._id });
        const total   = attendance.length;
        const present = attendance.filter((a) => a.status === "Present").length;
        const attendancePct = total > 0 ? Math.round((present / total) * 100) : 0;

        const avgMarks = marks.length > 0
          ? Math.round(marks.reduce((sum, m) => sum + m.marks, 0) / marks.length)
          : null;

        return {
          name:          s.name,
          department:    s.department,
          year:          s.year,
          rollNumber:    s.rollNumber,
          attendancePct,
          avgMarks,
          subjects: marks.map((m) => ({
            subject: m.course?.name || "Unknown",
            code:    m.course?.code || "",
            marks:   m.marks,
          })),
        };
      })
    );

    const prompt = `
You are an academic performance analyst for BCE Bhagalpur Engineering College.

Analyze the following student performance data:

${JSON.stringify(formattedData, null, 2)}

Generate a detailed report in Markdown format including:

1. **Overall Class Performance Summary** — average marks, attendance overview
2. **Top Performers** — students with highest marks
3. **At-Risk Students** — students with attendance < 75% or marks < 50
4. **Weak Subjects** — subjects with lowest average scores
5. **Strong Subjects** — subjects with highest average scores
6. **Department-wise Analysis** — performance breakdown by department
7. **Improvement Recommendations** — specific suggestions for weak areas
8. **Strategic Suggestions for Teachers** — actionable advice

Make it structured, professional, and data-driven.
`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    res.json({ report: result.text });

  } catch (error) {
    console.error("AI Report Error:", error);
    res.status(500).json({ error: "AI report generation failed", message: error.message });
  }
};