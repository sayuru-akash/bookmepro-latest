"use client";

import { Paper } from "@mui/material";
import { useRouter } from "next/navigation";
import StudentLogin from "../../../components/StudentLogin";

export default function StudentLoginForm() {
  const router = useRouter();
  return (
    <main className="min-h-screen bg-[#f4f7f5] grid place-items-center px-4 py-16">
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 520,
          p: { xs: 3, sm: 5 },
          borderRadius: 4,
          border: "1px solid #dce8e0",
        }}
      >
        <StudentLogin
          onSuccess={() => router.push("/student-dashboard")}
        />
      </Paper>
    </main>
  );
}
