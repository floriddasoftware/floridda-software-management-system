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
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      if (user.email === ADMIN_EMAIL) return true;

      try {
        const querySnapshot = await adminDb
          .collection("users")
          .where("email", "==", user.email)
          .where("role", "==", "salesperson")
          .get();

        return !querySnapshot.empty;
      } catch (error) {
        console.error("Error checking user role:", error);
        return false;
      }
    },
    async session({ session }) {
      const { email } = session.user;

      if (email === ADMIN_EMAIL) {
        session.user.role = "admin";
        session.user.name = "Floridda";

        try {
          const adminQuery = await adminDb
            .collection("users")
            .where("email", "==", email)
            .get();

          if (adminQuery.empty) {
            await adminDb.collection("users").add({
              email,
              role: "admin",
              name: "Floridda",
            });
          }
        } catch (error) {
          console.error("Error ensuring admin exists:", error);
        }

        return session;
      }

      try {
        const querySnapshot = await adminDb
          .collection("users")
          .where("email", "==", email)
          .get();

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          session.user.role = userData.role || "unknown";
          session.user.name = userData.name || "N/A";
        } else {
          session.user.role = "unknown";
          session.user.name = "N/A";
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        session.user.role = "unknown";
        session.user.name = "N/A";
      }

      return session;
    },
    redirect({ baseUrl }) {
      return `${baseUrl}/dashboard`;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});