//  const Student    = require("../models/Student");
// const Teacher    = require("../models/Teacher");
// const Attendance = require("../models/Attendance");
// const Marks      = require("../models/Marks");
// const Notice     = require("../models/Notice");
// const Routine    = require("../models/Routine");
// const { GoogleGenAI } = require("@google/genai");

// const OpenAI = require("openai");

// const groq = new OpenAI({
//   apiKey: process.env.GROQ_API_KEY,
//   baseURL: "https://api.groq.com/openai/v1",
// });

// const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// const BCE_KNOWLEDGE = `You are the official AI assistant of Bhagalpur College of Engineering (BCE), Bhagalpur, Bihar, India.
// You ONLY answer questions related to BCE Bhagalpur or the user\'s academic data.
// If asked anything unrelated to BCE or academics, say "I can only help with BCE-related queries."
// Keep answers concise — max 3-4 lines unless showing data.

// === ABOUT BCE BHAGALPUR ===
// Full name: Bhagalpur College of Engineering (BCE), Bhagalpur
// Location: Sabour, Bhagalpur, Bihar - 813210
// Established: 1960
// Affiliated to: Bihar Engineering University (BEU), Patna
// Type: Government Engineering College
// Result portal: https://beu-bih.ac.in/result-one

// === DEPARTMENTS === CSE, ECE, ME, CE, EE

// === ADMISSION ===
// Through JEE Main + BCECE Bihar counselling (bceceboard.bihar.gov.in)
// Eligibility: 10+2 PCM, min 75% (65% SC/ST), ~60 seats/branch

// === ACADEMIC SCHEDULE ===
// Classes: 10AM-5PM Mon-Sat
// Semester exams: May-June (Even) and Nov-Dec (Odd)
// Internal exam: Mid-semester (~8th week)

// === FEE STRUCTURE ===
// Tuition: ~Rs.30,000/sem | Hostel: ~Rs.15,000/sem | Exam: ~Rs.2,000/sem`;

// const buildUserContext = async (userId, role) => {
//   if (!userId || !role) return "";
//   try {
//     if (role === "student") {
//       const student = await Student.findById(userId).select("name rollNumber department year");
//       if (!student) return "";

//       const [attendance, marks, notices, routine] = await Promise.all([
//         Attendance.find({ student: userId }).populate("course","name code").sort({ date:-1 }).limit(100),
//         Marks.find({ student: userId }).populate("course","name code"),
//         Notice.find().sort({ createdAt:-1 }).limit(5),
//         Routine.findOne({
//           date: { $gte: new Date(new Date().setHours(0,0,0,0)), $lte: new Date(new Date().setHours(23,59,59,999)) },
//           branch: student.department,
//         }).populate("slots.teacher","name").populate("slots.course","name code"),
//       ]);

//       const subMap = {};
//       attendance.forEach(a => {
//         const k = a.course?.name || "Unknown";
//         if (!subMap[k]) subMap[k] = { total:0, present:0 };
//         subMap[k].total++;
//         if (a.status === "Present") subMap[k].present++;
//       });

//       const attLines = Object.entries(subMap)
//         .map(([s,d]) => `  ${s}: ${Math.round((d.present/d.total)*100)}% (${d.present}/${d.total})`)
//         .join("\n");

//       const totalAtt  = attendance.length;
//       const totalPres = attendance.filter(a=>a.status==="Present").length;
//       const overall   = totalAtt > 0 ? Math.round((totalPres/totalAtt)*100) : 0;
//       const marksLines = marks.map(m=>`  ${m.course?.name}: ${m.marks}/100`).join("\n");
//       const avgMarks   = marks.length ? Math.round(marks.reduce((s,m)=>s+m.marks,0)/marks.length) : 0;
//       const cgpa       = (avgMarks/10).toFixed(2);
//       const noticesLines = notices.map(n=>`  • ${n.title}`).join("\n");
//       const todaySlots = routine?.slots?.map(s=>`  ${s.startTime}-${s.endTime}: ${s.subject} (${s.teacher?.name||"—"})`).join("\n") || "  No routine published today";

//       return `\n=== STUDENT DATA ===
// Name: ${student.name} | Roll: ${student.rollNumber} | Dept: ${student.department} | Year: ${student.year}
// ATTENDANCE (Overall: ${overall}% — ${totalPres}/${totalAtt}):
// ${attLines || "  No records yet"}
// MARKS (Avg: ${avgMarks}/100 | CGPA: ${cgpa}):
// ${marksLines || "  No marks yet"}
// TODAY\'S ROUTINE (${student.department}):
// ${todaySlots}
// RECENT NOTICES:
// ${noticesLines || "  None"}`;
//     }

//     if (role === "teacher") {
//       const teacher = await Teacher.findById(userId).select("name department designation");
//       if (!teacher) return "";
//       const notices = await Notice.find().sort({ createdAt:-1 }).limit(5);
//       const routine = await Routine.findOne({
//         date: { $gte: new Date(new Date().setHours(0,0,0,0)), $lte: new Date(new Date().setHours(23,59,59,999)) },
//       }).populate("slots.teacher","name").populate("slots.course","name code");
//       const mySlots = routine?.slots?.filter(s=>s.teacher?._id?.toString()===userId) || [];
//       const schedule = mySlots.length
//         ? mySlots.map(s=>`  ${s.startTime}-${s.endTime}: ${s.subject}`).join("\n")
//         : "  No classes today";
//       return `\n=== TEACHER DATA ===
// Name: ${teacher.name} | Dept: ${teacher.department} | ${teacher.designation}
// Today\'s Classes:\n${schedule}
// Notices:\n${notices.map(n=>`  • ${n.title}`).join("\n") || "  None"}`;
//     }
//   } catch (e) {
//     console.error("buildUserContext error:", e.message);
//   }
//   return "";
// };

 
//  exports.chat = async (req, res) => {
//   try {
//     const { message, userId, role } = req.body;

//     if (!message) {
//       return res.status(400).json({ message: "Message required" });
//     }

//     const userContext = await buildUserContext(userId, role);

//     const systemPrompt =
//       BCE_KNOWLEDGE +
//       (userContext ||
//         "\n\n=== USER NOT LOGGED IN ===\nFor attendance/marks/routine — ask user to login first.");

//     let reply = "";

//     try {
//       // 🔥 PRIMARY: Gemini
//       const result = await ai.models.generateContent({
//         model: "gemini-2.0-flash",
//         contents: `${systemPrompt}\n\nUser question: ${message}`,
//       });

//       reply =
//         result?.candidates?.[0]?.content?.parts?.[0]?.text ||
//         "No response from Gemini";

//     } catch (err) {
//       console.error("Gemini failed:", err.status);

//       // 🔥 FALLBACK: Groq (FIXED MODEL)
//       if (err.status === 429 || err.status === 500) {
//         console.log("Switching to Groq fallback...");

//         const completion = await groq.chat.completions.create({
//           model: "llama-3.1-8b-instant", // ✅ FIXED
//           messages: [
//             { role: "system", content: systemPrompt }, // 🔥 IMPORTANT
//             { role: "user", content: message },
//           ],
//         });

//         reply = completion.choices[0].message.content;
//       } else {
//         throw err;
//       }
//     }

//     res.json({ success: true, reply });

//   } catch (error) {
//     console.error("AI chat error FULL:", error);

//     res.json({
//       success: false,
//       reply: "Server busy. Please try again later."
//     });
//   }
// };






const Student    = require("../models/Student");
const Teacher    = require("../models/Teacher");
const Attendance = require("../models/Attendance");
const Marks      = require("../models/Marks");
const Notice     = require("../models/Notice");
const Routine    = require("../models/Routine");
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const BCE_KNOWLEDGE = `You are the official AI assistant of Bhagalpur College of Engineering (BCE), Bhagalpur, Bihar, India.
ONLY answer questions about BCE Bhagalpur or the user's personal academic data shown below.
If asked anything else say: "I can only help with BCE-related queries."
Be concise — max 4 lines unless showing data tables.

=== BCE BHAGALPUR ===
Location: Sabour, Bhagalpur, Bihar - 813210 | Est: 1960
Affiliated: Bihar Engineering University (BEU), Patna
Type: Government Engineering College
Result portal: https://beu-bih.ac.in/result-one
Departments: CSE, ECE, ME, CE, EE

=== ADMISSION ===
Via JEE Main + BCECE Bihar counselling (bceceboard.bihar.gov.in)
Eligibility: 10+2 PCM min 75% (65% SC/ST) | ~60 seats/branch

=== SCHEDULE ===
Classes: 10AM-5PM Mon-Sat
Exams: May-June (Even) | Nov-Dec (Odd) | Internal: mid-semester

=== FEES ===
Tuition ~Rs.30,000/sem | Hostel ~Rs.15,000/sem | Exam ~Rs.2,000/sem`;

const buildUserContext = async (userId, role) => {
  if (!userId || !role) return null;
  try {
    if (role === "student") {
      const student = await Student.findById(userId).select("name rollNumber department year");
      if (!student) return null;

      const [attendance, marks, notices, routine] = await Promise.all([
        Attendance.find({ student: userId }).populate("course","name code").sort({ date:-1 }).limit(200),
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

      const attLines  = Object.entries(subMap).map(([s,d]) => `  ${s}: ${Math.round((d.present/d.total)*100)}% (${d.present}/${d.total})`).join("\n");
      const lowAtt    = Object.entries(subMap).filter(([,d]) => Math.round((d.present/d.total)*100) < 75).map(([s,d]) => `  ⚠️ ${s}: ${Math.round((d.present/d.total)*100)}%`).join("\n");
      const totalAtt  = attendance.length;
      const totalPres = attendance.filter(a=>a.status==="Present").length;
      const overall   = totalAtt > 0 ? Math.round((totalPres/totalAtt)*100) : 0;
      const marksLines = marks.map(m=>`  ${m.course?.name||"Unknown"}: ${m.marks}/100`).join("\n");
      const avgMarks   = marks.length ? Math.round(marks.reduce((s,m)=>s+m.marks,0)/marks.length) : 0;
      const cgpa       = (avgMarks/10).toFixed(2);
      const todaySlots = routine?.slots?.length ? routine.slots.map(s=>`  ${s.startTime}-${s.endTime}: ${s.subject} (${s.teacher?.name||"—"})`).join("\n") : "  No routine today";
      const noticeLines = notices.map(n=>`  • ${n.title}: ${(n.message||"").slice(0,80)}`).join("\n");

      return `\n=== STUDENT: ${student.name} ===\nRoll: ${student.rollNumber} | Dept: ${student.department} | Year: ${student.year}\n\nATTENDANCE — Overall: ${overall}% (${totalPres}/${totalAtt})\n${attLines||"  No records"}\n${lowAtt ? `\nLOW (<75%):\n${lowAtt}` : "\nAll subjects ≥75% ✅"}\n\nMARKS — Avg: ${avgMarks}/100 | CGPA: ${cgpa}\n${marksLines||"  No marks yet"}\n\nTODAY'S CLASSES (${student.department}):\n${todaySlots}\n\nNOTICES:\n${noticeLines||"  None"}`;
    }

    if (role === "teacher") {
      const teacher = await Teacher.findById(userId).select("name department designation");
      if (!teacher) return null;

      const routines = await Routine.find({
        date: { $gte: new Date(new Date().setHours(0,0,0,0)), $lte: new Date(new Date().setHours(23,59,59,999)) },
      }).populate("slots.teacher","name").populate("slots.course","name code");

      const myClasses = [];
      routines.forEach(r => {
        r.slots.forEach(s => {
          if (s.teacher?._id?.toString() === userId)
            myClasses.push(`  ${s.startTime}-${s.endTime}: ${s.subject} [${r.branch}]`);
        });
      });

      const notices = await Notice.find().sort({ createdAt:-1 }).limit(5);
      return `\n=== TEACHER: ${teacher.name} ===\nDept: ${teacher.department} | ${teacher.designation}\n\nTODAY'S CLASSES:\n${myClasses.length ? myClasses.join("\n") : "  No classes today"}\n\nNOTICES:\n${notices.map(n=>`  • ${n.title}`).join("\n")||"  None"}`;
    }
  } catch (e) {
    console.error("buildUserContext error:", e.message);
  }
  return null;
};

exports.chat = async (req, res) => {
  try {
    const { message, userId, role } = req.body;
    if (!message) return res.status(400).json({ message: "Message required" });
    if (!process.env.GEMINI_API_KEY) return res.status(500).json({ message: "GEMINI_API_KEY not set" });

    const userContext = await buildUserContext(userId, role);

    const fullPrompt = userContext
      ? `${BCE_KNOWLEDGE}\n${userContext}\n\nUser asks: ${message}`
      : `${BCE_KNOWLEDGE}\n\n=== NOT LOGGED IN ===\nFor personal data (attendance/marks/routine) — tell user to login first.\n\nUser asks: ${message}`;

    const result = await ai.models.generateContent({
      model:    "gemini-2.0-flash",
      contents: fullPrompt,
    });

    // ✅ result.text is the correct property for @google/genai SDK
    const reply = result.text || "Sorry, I could not process that.";
    res.json({ success: true, reply });

  } catch (error) {
    console.error("AI chat error:", error.message || error);
    res.status(500).json({ success: false, reply: "Server busy. Please try again.", message: error.message });
  }
};