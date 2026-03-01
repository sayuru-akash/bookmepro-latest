import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import connectToDatabase from "../../Lib/mongodb"; 

export const studentAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { db } = await connectToDatabase();
        const student = await db.collection("students").findOne({
          email: credentials.email,
        });

        if (!student) throw new Error("No student found with that email.");
        if (!student.password) throw new Error("Invalid authentication method");

        const isValid = await bcrypt.compare(credentials.password, student.password);
        if (!isValid) throw new Error("Invalid password.");

        return {
          id: student._id.toString(),
          email: student.email,
          name: student.fullName,
          phone: student.phone,
          address: student.address,
          coachId: student.coachId,
          role: student.role || "student",
        };
      },
    }),
  ],
  pages: {
    signIn: "/student/login",
    error: "/student/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const { db } = await connectToDatabase();
          const existingStudent = await db.collection("students").findOne({
            email: user.email,
          });

          if (!existingStudent) return "/student/register?error=NoCoachAssigned";
          return true;
        } catch (error) {
          console.error("Google sign-in error:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token = { ...token, id: user.id, email: user.email, name: user.name, phone: user.phone, address: user.address, coachId: user.coachId, role: user.role || "student" };
      } else {
        const { db } = await connectToDatabase();
        const dbStudent = await db.collection("students").findOne({ email: token.email });

        if (dbStudent) {
          token.id = dbStudent._id.toString();
          token.name = dbStudent.fullName;
          token.phone = dbStudent.phone;
          token.address = dbStudent.address;
          token.coachId = dbStudent.coachId;
          token.role = dbStudent.role || "student";
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user = { id: token.id, email: token.email, name: token.name, phone: token.phone, address: token.address, coachId: token.coachId, role: token.role || "student" };
      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
};
