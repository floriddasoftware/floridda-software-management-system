import NextAuth from "next-auth";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import { cert } from "firebase-admin/app";
import Nodemailer from "next-auth/providers/nodemailer";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  addDoc,
} from "firebase/firestore";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Nodemailer({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
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
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      const adminEmail = "eromotoya@gmail.com";
      if (user.email === adminEmail) {
        return true; 
      }
      const q = query(
        collection(db, "users"),
        where("email", "==", user.email),
        where("role", "==", "Salesperson")
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    },
    async session({ session }) {
      const { email } = session.user;
      const q = query(collection(db, "users"), where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        session.user.role = userData.role || "unknown";
        if (email === "eromotoya@gmail.com") {
          session.user.name = userData.name || "Floridda";
          if (!userData.name) {
            await updateDoc(querySnapshot.docs[0].ref, { name: "Floridda" });
          }
        } else {
          session.user.name = userData.name || "N/A";
        }
      } else if (email === "eromotoya@gmail.com") {
        session.user.role = "Admin";
        session.user.name = "Floridda";
        await addDoc(collection(db, "users"), {
          email,
          role: "admin",
          name: "Floridda",
        });
      } else {
        session.user.role = "unknown";
        session.user.name = "N/A";
      }
      return session;
    },
  },
});