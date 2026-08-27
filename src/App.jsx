import { AccessPage } from "./pages/AccessPage";
import { DocumentsPage } from "./pages/DocumentsPage";

export default function App() {
  if (window.location.pathname.startsWith("/acceso")) {
    return <AccessPage />;
  }

  return <DocumentsPage />;
}
