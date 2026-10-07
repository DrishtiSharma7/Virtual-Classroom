import * as XLSX from "xlsx";

// Expected columns (header row, case-insensitive matching):
// Question | Option1 | Option2 | Option3 | Option4 | CorrectOption (1-4) | TimeLimit (seconds)
export const parseQuizExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);

        const questions = rows
          .map((row) => {
            const options = [row.Option1, row.Option2, row.Option3, row.Option4]
              .filter((o) => o !== undefined && o !== null && String(o).trim() !== "")
              .map((o) => String(o).trim());
            const correctIndex = Number(row.CorrectOption ?? row.CorrectAnswer) - 1;

            return {
              question: String(row.Question ?? "").trim(),
              options,
              correctAnswer: correctIndex,
              timeLimit: Number(row.TimeLimit) || 60,
            };
          })
          .filter(
            (q) =>
              q.question &&
              q.options.length >= 2 &&
              q.correctAnswer >= 0 &&
              q.correctAnswer < q.options.length,
          );

        if (questions.length === 0) {
          reject(new Error("No valid questions found in the file."));
          return;
        }

        resolve(questions);
      } catch (err) {
        reject(new Error("Could not parse the Excel file. Check the format and try again."));
      }
    };

    reader.onerror = () => reject(new Error("Failed to read the file."));
    reader.readAsArrayBuffer(file);
  });
};

// Downloadable template so teachers know the exact column format expected above.
export const downloadQuizTemplate = () => {
  const rows = [
    {
      Question: "What is the derivative of x^2?",
      Option1: "2x",
      Option2: "x^2/2",
      Option3: "x",
      Option4: "2",
      CorrectOption: 1,
      TimeLimit: 60,
    },
  ];

  const sheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, sheet, "Questions");
  XLSX.writeFile(workbook, "quiz-import-template.xlsx");
};

// results: array from getQuizResults() -> [{ student: {name, email}, answers, score, ... }]
export const exportResultsToExcel = (results, quizTitle = "Quiz Results") => {
  const rows = results.map((r) => ({
    "Student Name": r.student?.name || "Unknown",
    Email: r.student?.email || "",
    Score: r.score,
    "Submitted At": r.createdAt ? new Date(r.createdAt).toLocaleString() : "",
  }));

  const sheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  // Sheet names can't exceed 31 chars or contain []:*?/\
  const safeSheetName = quizTitle.replace(/[\[\]:*?/\\]/g, "").slice(0, 31) || "Results";

  XLSX.utils.book_append_sheet(workbook, sheet, safeSheetName);

  const safeFileName = quizTitle.replace(/[^a-z0-9-_ ]/gi, "").trim() || "quiz-results";
  XLSX.writeFile(workbook, `${safeFileName}.xlsx`);
};