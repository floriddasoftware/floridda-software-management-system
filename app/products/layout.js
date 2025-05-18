import Layout from "@/components/Layout";
import { ThemeProvider } from "@/components/ThemeContext";

export default function ProductsLayout({ children }) {
  return (
    <Layout>
      <ThemeProvider>{children}</ThemeProvider>
    </Layout>
  );
}
