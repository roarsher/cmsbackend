 const Student    = require("../models/Student");
const Teacher    = require("../models/Teacher");
const Attendance = require("../models/Attendance");
const Marks      = require("../models/Marks");
const Notice     = require("../models/Notice");
const Routine    = require("../models/Routine");
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const BCE_KNOWLEDGE = `You are the official AI assistant of Bhagalpur College of Engineering (BCE), Bhagalpur, Bihar, India.
You ONLY answer questions related to BCE Bhagalpur or the user\'s academic data.
If asked anything unrelated to BCE or academics, say "I can only help with BCE-related queries."
Keep answers concise — max 3-4 lines unless showing data.

=== ABOUT BCE BHAGALPUR ===
Full name: Bhagalpur College of Engineering (BCE), Bhagalpur
Location: Sabour, Bhagalpur, Bihar - 813210
Established: 1960
Affiliated to: Bihar Engineering University (BEU), Patna
Type: Government Engineering College
Result portal: https://beu-bih.ac.in/result-one

=== DEPARTMENTS === CSE, ECE, ME, CE, EE

=== ADMISSION ===
Through JEE Main + BCECE Bihar counselling (bceceboard.bihar.gov.in)
Eligibility: 10+2 PCM, min 75% (65% SC/ST), ~60 seats/branch

=== ACADEMIC SCHEDULE ===
Classes: 10AM-5PM Mon-Sat
Semester exams: May-June (Even) and Nov-Dec (Odd)
Internal exam: Mid-semester (~8th week)

=== FEE STRUCTURE ===
Tuition: ~Rs.30,000/sem | Hostel: ~Rs.15,000/sem | Exam: ~Rs.2,000/sem`;

const buildUserContext = async (userId, role) => {
  if (!userId || !role) return "";
  try {
    if (role === "student") {
      const student = await Student.findById(userId).select("name rollNumber department year");
      if (!student) return "";

      const [attendance, marks, notices, routine] = await Promise.all([
        Attendance.find({ student: userId }).populate("course","name code").sort({ date:-1 }).limit(100),
        Marks.find({ student: userId }).populate("course","name code"),
        Notice.find().sort({ createdAt:-1 }).limit(5),
        Routine.findOne({
          date: { $gte: new Date(new Date().setHours(0,0,0,0)), $lte: new Date(new Date().setHours(23,59,59,999)) },
          branch: student.department,
        }).populate("slots.teacher","name").populate("slots.course","name code"),
      ]);

      const subMap = {};
      attendance.forEach(a => {
        const k = a.course?.name || "Unknown";
        if (!subMap[k]) subMap[k] = { total:0, present:0 };
        subMap[k].total++;
        if (a.status === "Present") subMap[k].present++;
      });

      const attLines = Object.entries(subMap)
        .map(([s,d]) => `  ${s}: ${Math.round((d.present/d.total)*100)}% (${d.present}/${d.total})`)
        .join("\n");

      const totalAtt  = attendance.length;
      const totalPres = attendance.filter(a=>a.status==="Present").length;
      const overall   = totalAtt > 0 ? Math.round((totalPres/totalAtt)*100) : 0;
      const marksLines = marks.map(m=>`  ${m.course?.name}: ${m.marks}/100`).join("\n");
      const avgMarks   = marks.length ? Math.round(marks.reduce((s,m)=>s+m.marks,0)/marks.length) : 0;
      const cgpa       = (avgMarks/10).toFixed(2);
      const noticesLines = notices.map(n=>`  • ${n.title}`).join("\n");
      const todaySlots = routine?.slots?.map(s=>`  ${s.startTime}-${s.endTime}: ${s.subject} (${s.teacher?.name||"—"})`).join("\n") || "  No routine published today";

      return `\n=== STUDENT DATA ===
Name: ${student.name} | Roll: ${student.rollNumber} | Dept: ${student.department} | Year: ${student.year}
ATTENDANCE (Overall: ${overall}% — ${totalPres}/${totalAtt}):
${attLines || "  No records yet"}
MARKS (Avg: ${avgMarks}/100 | CGPA: ${cgpa}):
${marksLines || "  No marks yet"}
TODAY\'S ROUTINE (${student.department}):
${todaySlots}
RECENT NOTICES:
${noticesLines || "  None"}`;
    }

    if (role === "teacher") {
      const teacher = await Teacher.findById(userId).select("name department designation");
      if (!teacher) return "";
      const notices = await Notice.find().sort({ createdAt:-1 }).limit(5);
      const routine = await Routine.findOne({
        date: { $gte: new Date(new Date().setHours(0,0,0,0)), $lte: new Date(new Date().setHours(23,59,59,999)) },
      }).populate("slots.teacher","name").populate("slots.course","name code");
      const mySlots = routine?.slots?.filter(s=>s.teacher?._id?.toString()===userId) || [];
      const schedule = mySlots.length
        ? mySlots.map(s=>`  ${s.startTime}-${s.endTime}: ${s.subject}`).join("\n")
        : "  No classes today";
      return `\n=== TEACHER DATA ===
Name: ${teacher.name} | Dept: ${teacher.department} | ${teacher.designation}
Today\'s Classes:\n${schedule}
Notices:\n${notices.map(n=>`  • ${n.title}`).join("\n") || "  None"}`;
    }
  } catch (e) {
    console.error("buildUserContext error:", e.message);
  }
  return "";
};

// exports.chat = async (req, res) => {
//   try {
//     const { message, userId, role } = req.body;
//     if (!message) return res.status(400).json({ message: "Message required" });

//     if (!process.env.GEMINI_API_KEY) {
//       return res.status(500).json({ message: "GEMINI_API_KEY not configured" });
//     }

//     const userContext = await buildUserContext(userId, role);
//     const systemPrompt = BCE_KNOWLEDGE +
//       (userContext || "\n\n=== USER NOT LOGGED IN ===\nFor attendance/marks/routine — ask user to login first.");

//     const result = await ai.models.generateContent({
//       model: "gemini-2.0-flash",
//       contents: `${systemPrompt}\n\nUser question: ${message}`,
//     });

//     // const reply = result.text || "Sorry, I could not process that.";
//     const reply =
//   result?.candidates?.[0]?.content?.parts?.[0]?.text ||
//   "Sorry, I could not process that.";
//     res.json({ success: true, reply });

//   } catch (error) {
//     console.error("AI chat error:", error.message || error);
//     res.status(500).json({ message: "AI error: " + (error.message || "unknown") });
//   }
// };

exports.chat = async (req, res) => {
  try {
    const { message, userId, role } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: "GEMINI_API_KEY not configured" });
    }

    const userContext = await buildUserContext(userId, role);

    const systemPrompt =
      BCE_KNOWLEDGE +
      (userContext ||
        "\n\n=== USER NOT LOGGED IN ===\nFor attendance/marks/routine — ask user to login first.");

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `${systemPrompt}\n\nUser question: ${message}`,
    });

    const reply =
      result?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I could not process that.";

    res.json({ success: true, reply });

  } catch (error) {
    console.error("AI chat error FULL:", error);
    res.status(500).json({
      message: "AI error",
      error: error.message
    });
  }
};