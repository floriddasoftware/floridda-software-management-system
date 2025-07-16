import NextAuth from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import { adminDb } from "@/lib/firebaseAdmin";
import { cert } from "firebase-admin/app";

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
  adapter: FirestoreAdapter({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.AUTH_FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.AUTH_FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  }),
  pages: { signIn: "/login" },
  callbacks: {
    async signIn({ user }) {
      console.log(`Sign-in attempt for email: ${user.email}`);
      try {
        if (user.email === ADMIN_EMAIL) {
          console.log("Admin login allowed");
          return true;
        }

        const querySnapshot = await adminDb
          .collection("users")
          .where("email", "==", user.email)
          .where("role", "==", "salesperson")
          .get();

        return !querySnapshot.empty;
      } catch (error) {
        console.error("Error during sign-in:", error);
        return false;
      }
    },
    async session({ session }) {
      try {
        if (!session.user?.email) return session;

        const email = session.user.email;
        let userRecord;

        if (email === ADMIN_EMAIL) {
          session.user = {
            ...session.user,
            role: "admin",
            name: "Floridda Admin",
            branchId: null,
          };

          try {
            await adminDb.collection("users").doc(email).set(
              {
                email,
                role: "admin",
                name: "Floridda Admin",
                createdAt: new Date().toISOString(),
              },
              { merge: true }
            );
          } catch (e) {
            console.error("Error creating admin record:", e);
          }
          return session;
        }

        const userQuery = await adminDb
          .collection("users")
          .where("email", "==", email)
          .limit(1)
          .get();

        if (!userQuery.empty) {
          userRecord = userQuery.docs[0].data();
          session.user = {
            ...session.user,
            role: userRecord.role || "unknown",
            name: userRecord.name || "Unknown",
            branchId: userRecord.branchId || null,
          };
        } else {
          session.user.role = "unknown";
        }
      } catch (error) {
        console.error("Session callback error:", error);
        session.user.role = "error";
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      return url.startsWith(baseUrl) ? url : baseUrl + "/dashboard";
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, 
    updateAge: 24 * 60 * 60, 
  },
  debug: process.env.NODE_ENV === "development",
});