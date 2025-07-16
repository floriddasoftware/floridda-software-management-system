import NextAuth from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import { adminDb } from "@/lib/firebaseAdmin";

const ADMIN_EMAIL = "floriddasoftware@gmail.com";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Nodemailer({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
        secure: true,
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  adapter: FirestoreAdapter(adminDb),
  pages: { signIn: "/login" },
  callbacks: {
    async signIn({ user }) {
      console.log(`Sign-in attempt for email: ${user.email}`);
      if (user.email === ADMIN_EMAIL) {
        console.log("Admin email detected, allowing sign-in.");
        return true;
      }
      try {
        const querySnapshot = await adminDb
          .collection("users")
          .where("email", "==", user.email)
          .where("role", "==", "salesperson")
          .get();
        const allowed = !querySnapshot.empty;
        console.log(`Salesperson check: ${allowed ? "Allowed" : "Denied"}`);
        return allowed;
      } catch (error) {
        console.error("Error checking user role:", error);
        return false;
      }
    },
    async session({ session }) {
      const { email } = session.user;
      console.log(`Setting session for email: ${email}`);
      try {
        const userQuery = await adminDb
          .collection("users")
          .where("email", "==", email)
          .get();
        if (!userQuery.empty) {
          const userData = userQuery.docs[0].data();
          session.user.role = userData.role || "unknown";
          session.user.name = userData.name || "N/A";
          session.user.branchId = userData.branchId || null;
          console.log(`User found: ${JSON.stringify(userData)}`);
        } else if (email === ADMIN_EMAIL) {
          session.user.role = "admin";
          session.user.name = "Floridda";
          session.user.branchId = null;
          console.log("Admin not in DB, setting role and adding to users.");
          await adminDb.collection("users").doc(email).set(
            {
              email,
              role: "admin",
              name: "Floridda",
            },
            { merge: true }
          );
        } else {
          session.user.role = "unknown";
          session.user.name = "N/A";
          session.user.branchId = null;
          console.log("User not found and not admin, setting role to unknown.");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        session.user.role = "unknown";
        session.user.name = "N/A";
        session.user.branchId = null;
      }
      console.log(`Final session role: ${session.user.role}`);
      return session;
    },
    async redirect({ baseUrl }) {
      console.log(`Redirecting to: ${baseUrl}/dashboard`);
      return `${baseUrl}/dashboard`;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});