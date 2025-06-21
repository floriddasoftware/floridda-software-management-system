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
      console.log("SignIn callback - User email:", user.email);
      if (user.email === ADMIN_EMAIL) {
        console.log("Admin sign-in allowed");
        return true;
      }

      try {
        const querySnapshot = await adminDb
          .collection("users")
          .where("email", "==", user.email)
          .where("role", "==", "salesperson")
          .get();

        const allowed = !querySnapshot.empty;
        console.log(`Salesperson check for ${user.email}: ${allowed}`);
        return allowed;
      } catch (error) {
        console.error("Error checking user role in signIn:", error);
        return false;
      }
    },
    async session({ session }) {
      const { email } = session.user;
      console.log("Session callback - User email:", email);

      if (email === ADMIN_EMAIL) {
        session.user.role = "admin";
        session.user.name = "Floridda";
        console.log("Admin role assigned:", session.user);

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
            console.log("Admin user created in Firestore");
          }
        } catch (error) {
          console.error("Error ensuring admin exists:", error);
        }
      } else {
        // For salespeople, rely on FirestoreAdapter data if available
        if (!session.user.role) {
          try {
            const userQuery = await adminDb
              .collection("users")
              .where("email", "==", email)
              .get();
            if (!userQuery.empty) {
              const userData = userQuery.docs[0].data();
              session.user.role = userData.role || "unknown";
              session.user.name = userData.name || "N/A";
              console.log("Salesperson role assigned:", session.user);
            } else {
              session.user.role = "unknown";
              session.user.name = "N/A";
              console.log("No user data found, set to unknown:", session.user);
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
            session.user.role = "unknown";
            session.user.name = "N/A";
          }
        }
      }
      return session;
    },
    async redirect({ baseUrl }) {
      return `${baseUrl}/dashboard`;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});