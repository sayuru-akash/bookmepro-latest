// app/student-auth/login/page.js
"use client";
import React, { Suspense } from "react";
import StudentLoginForm from "./StudentLoginForm";

export default function StudentLoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StudentLoginForm />
    </Suspense>
  );
}
