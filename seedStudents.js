 



  

//  mongoose.connect("");

 

// const seedStudents = async () => {
//   try {
//     const students = [];

//     // ✅ All branches added
//     const branches = [
//       { name: "CSE", startRoll: 22501 },
//       { name: "ECE", startRoll: 22401 },
//       { name: "ME",  startRoll: 22201 },
//       { name: "EE",  startRoll: 22301 },
//       { name: "CE",  startRoll: 22101 }
//     ];

//     // ✅ Hash password ONCE (optimized)
//     const hashedPassword = await bcrypt.hash("cms22536..", 10);

//     for (let b of branches) {
//       for (let i = 1; i <= 20; i++) {
//         students.push({
//           name: `student${b.name}${i}`,
//           email: `student${b.name}${i}@gmail.com`,
//           password: hashedPassword,
//           rollNumber: `${b.startRoll + i - 1}`,
//           department: b.name,
//           year: 1,
//           role: "student"
//         });
//       }
//     }

//     // ✅ Optional: clear old data before inserting
//     await Student.deleteMany({});

//     // ✅ Insert all students
//     await Student.insertMany(students);

//     console.log("✅ All students inserted successfully");
//     process.exit();
//   } catch (err) {
//     console.error(err);
//     process.exit(1);
//   }
// };

// seedStudents();