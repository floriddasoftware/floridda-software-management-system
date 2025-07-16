import NextAuth from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import { adminDb } from "@/lib/firebaseAdmin";

const ADMIN_EMAIL = "floriddasoftware@gmail.com".toLowerCase();

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
      const lowerEmail = user.email.toLowerCase();
      console.log(`Sign-in attempt for email: ${lowerEmail}`);
      if (lowerEmail === ADMIN_EMAIL) {
        console.log("Admin email detected, allowing sign-in.");
        return true;
      }
      try {
        const querySnapshot = await adminDb
          .collection("userProfiles")
          .where("email", "==", lowerEmail)
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
      const lowerEmail = session.user.email.toLowerCase();
      console.log(`[Session] Setting session for email: ${lowerEmail}`);

      if (lowerEmail === ADMIN_EMAIL) {
        session.user.role = "admin";
        session.user.name = "Floridda";
        session.user.branchId = null;
        console.log("[Session] Admin email detected, role set to 'admin'");

        try {
          const profileDoc = await adminDb
            .collection("userProfiles")
            .doc(lowerEmail)
            .get();
          if (!profileDoc.exists) {
            await adminDb.collection("userProfiles").doc(lowerEmail).set(
              {
                email: lowerEmail,
                role: "admin",
                name: "Floridda",
                createdAt: new Date().toISOString(),
              },
              { merge: true }
            );
            console.log("[Session] Admin profile created successfully");
          } else {
            console.log("[Session] Admin profile already exists");
          }
        } catch (error) {
          console.error("[Session] Error creating admin profile:", error);
        }
      } else {
        try {
          const profileDoc = await adminDb
            .collection("userProfiles")
            .doc(lowerEmail)
            .get();
          if (profileDoc.exists) {
            const profileData = profileDoc.data();
            session.user.role = profileData.role || "unknown";
            session.user.name = profileData.name || "N/A";
            session.user.branchId = profileData.branchId || null;
            console.log(
              `[Session] Profile found: ${JSON.stringify(profileData)}`
            );
          } else {
            session.user.role = "unknown";
            session.user.name = "N/A";
            session.user.branchId = null;
            console.log("[Session] No profile found, role set to 'unknown'");
          }
        } catch (error) {
          console.error("[Session] Error fetching user profile:", error);
          session.user.role = "unknown";
          session.user.name = "N/A";
          session.user.branchId = null;
        }
      }
      console.log(`[Session] Final session role: ${session.user.role}`);
      return session;
    },
    async redirect({ baseUrl }) {
      console.log(`[Redirect] Redirecting to: ${baseUrl}/dashboard`);
      return `${baseUrl}/dashboard`;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});