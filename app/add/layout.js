import Layout from "@/components/Layout";
import { ThemeProvider } from "@/components/ThemeContext";

export default function AddLayout({ children }) {
  return <Layout>{children}</Layout>;
}
