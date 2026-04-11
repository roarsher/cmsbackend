 require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const http    = require("http");
const { Server } = require("socket.io");
const connectDB  = require("./config/db");

const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://cmsfrontend-rosy.vercel.app"],
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);
  socket.on("join_dept",    (dept)      => { socket.join(`dept_${dept}`); console.log(`${socket.id} joined dept_${dept}`); });
  socket.on("join_session", (sessionId) => { socket.join(`session_${sessionId}`); });
  socket.on("disconnect",   ()          => console.log("❌ Socket disconnected:", socket.id));
});

connectDB();

app.use(cors({
  origin: ["http://localhost:3000", "https://cmsfrontend-rosy.vercel.app"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.get("/", (req, res) => res.status(200).json({ message: "Smart College API Running..." }));

// Routes
app.use("/api/auth",            require("./routes/authRoutes"));
app.use("/api/admin",           require("./routes/adminRoutes"));
app.use("/api/student",         require("./routes/studentRoutes"));
app.use("/api/teacher",         require("./routes/teacherRoutes"));
app.use("/api/attendance",      require("./routes/attendanceRoutes"));
app.use("/api/marks",           require("./routes/marksRoutes"));
app.use("/api/fees",            require("./routes/feeRoutes"));
app.use("/api/routines",        require("./routes/routineRoutes"));
app.use("/api/live-attendance", require("./routes/liveAttendanceRoutes"));
app.use("/api/ai",              require("./routes/aiRoutes"));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Server Error" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));