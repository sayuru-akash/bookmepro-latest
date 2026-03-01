// Lib/auth/nextauth-options.js
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectToDatabase from "../mongodb";
import User from "../../models/user";
import Student from "../../models/student";
import Admin from "../../models/admin";

export const authOptions = {
  providers: [
    // Google Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    // Coach/User Credentials Provider
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await connectToDatabase();
        const email = credentials.email.toLowerCase();
        const user = await User.findOne({ email: credentials.email }).lean();
        if (!user) throw new Error("No user found with that email.");
        if (!user.password) throw new Error("Invalid authentication method");

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );
        if (!isValid) throw new Error("Invalid password.");

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          paymentStatus: user.paymentStatus,
          stripeCustomerId: user.stripeCustomerId,
          stripeSubscriptionId: user.stripeSubscriptionId,
          role: user.role,
          profilePhoto: user.profilePhoto,
          plan: user.plan,
          billingCycle: user.billingCycle,
          maxStudents: user.maxStudents,
          videoLink: user.videoLink,
        };
      },
    }),
    // Student Credentials Provider
    CredentialsProvider({
      id: "student-credentials",
      name: "Student Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await connectToDatabase();
        const student = await Student.findOne({
          email: credentials.email,
        }).lean();
        if (!student) throw new Error("No student found with that email.");

        const isValid = await bcrypt.compare(
          credentials.password,
          student.password,
        );
        if (!isValid) throw new Error("Invalid password.");

        return {
          id: student._id.toString(),
          email: student.email,
          name: student.name,
          role: "student",
        };
      },
    }),
    // Admin Credentials Provider
    CredentialsProvider({
      id: "admin-credentials",
      name: "Admin Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await connectToDatabase();
        const admin = await Admin.findOne({
          email: credentials.email,
        }).lean();
        if (!admin) throw new Error("No admin found with that username.");
        const isValid = await bcrypt.compare(
          credentials.password,
          admin.password,
        );
        if (!isValid) throw new Error("Invalid password.");

        return {
          id: admin._id.toString(),
          email: admin.email,
          role: "admin",
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async signIn({ user, account }) {
      // When signing in with Google, create a new coach/user if not exists.
      if (account?.provider === "google") {
        try {
          await connectToDatabase();
          const existingUser = await User.findOne({ email: user.email }).lean();
          if (!existingUser) {
            await User.create({
              email: user.email,
              name: user.name || "",
              firstName: user.name?.split(" ")[0] || "",
              lastName: user.name?.split(" ").slice(1).join(" ") || "",
              profilePhoto: user.image || "",
              paymentStatus: "inactive",
              role: "coach",
              billingCycle: "monthly",
              provider: "google",
              createdAt: new Date(),
              stripeCustomerId: null,
              stripeSubscriptionId: null,
              plan: "starter",
              maxStudents: 25,
              contact: "",
              nextResetDate: new Date(),
              password: "",
            });
          }
          return true;
        } catch (error) {
          console.error("Google sign-in error:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      // When a user is returned on sign-in, set token values.
      if (user) {
        token = {
          ...token,
          id: user.id,
          email: user.email || null,
          name: user.name || user.email || null,
          role: user.role,
        };

        // For coach/users, add additional fields
        if (user.role === "coach" || (!user.role && user.paymentStatus)) {
          token = {
            ...token,
            paymentStatus: user.paymentStatus,
            stripeCustomerId: user.stripeCustomerId,
            stripeSubscriptionId: user.stripeSubscriptionId,
            plan: user.plan,
            billingCycle: user.billingCycle,
            profilePhoto: user.profilePhoto,
            maxStudents: user.maxStudents,
          };
        }
      } else {
        // For subsequent JWT callbacks (e.g., page refresh), retrieve full user info from the database.
        await connectToDatabase();
        const dbUser = await User.findOne({ email: token.email }).lean();
        if (dbUser) {
          token.id = dbUser._id.toString();
          token.paymentStatus = dbUser.paymentStatus;
          token.plan = dbUser.plan;
          token.billingCycle = dbUser.billingCycle;
          token.stripeCustomerId = dbUser.stripeCustomerId;
          token.stripeSubscriptionId = dbUser.stripeSubscriptionId;
          token.role = dbUser.role || "coach";
          token.profilePhoto = dbUser.profilePhoto;
          token.maxStudents = dbUser.maxStudents;
          token.username = dbUser.username || null;
        } else {
          // Check if it's a student.
          const stdUser = await Student.findOne({ email: token.email }).lean();
          if (stdUser) {
            token.id = stdUser._id.toString();
            token.role = "student";
            token.name = stdUser.name || token.name;
          }

          // Check if it's an admin.
          const adminUser = await Admin.findOne({ email: token.email }).lean();
          if (adminUser) {
            token.id = adminUser._id.toString();
            token.role = "admin";
            token.name = adminUser.email || token.name;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Map token values to session.
      session.user = {
        id: token.id,
        email: token.email,
        name: token.name,
        role: token.role || "none",
      };

      // Add additional fields for coach/users.
      if (token.role === "coach") {
        session.user = {
          ...session.user,
          paymentStatus: token.paymentStatus,
          stripeCustomerId: token.stripeCustomerId,
          stripeSubscriptionId: token.stripeSubscriptionId,
          billingCycle: token.billingCycle,
          plan: token.plan,
          profilePhoto: token.profilePhoto,
          maxStudents: token.maxStudents,
          username: token.username || null,
        };
      }
      return session;
    },
  },
  debug: false,
};
