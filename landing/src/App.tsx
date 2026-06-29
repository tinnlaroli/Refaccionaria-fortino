import { Layout } from "./components/Layout";
import { useTheme } from "./hooks/useTheme";
import { HomePage } from "./pages/HomePage";

export default function App() {
  const { theme, toggle } = useTheme();

  return (
    <Layout theme={theme} onToggleTheme={toggle}>
      <HomePage />
    </Layout>
  );
}
