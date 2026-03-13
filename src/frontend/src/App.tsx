import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useLocation,
} from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { CustomCursor } from "./components/CustomCursor";
import { StealthAdminClaim } from "./components/StealthAdminClaim";
import { CursorProvider } from "./context/CursorContext";
import { VisibilityContextProvider } from "./context/VisibilityContext";
import { InternetIdentityProvider } from "./hooks/useInternetIdentity";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminLogin } from "./pages/AdminLogin";
import { Art } from "./pages/Art";
import { ArtPractice } from "./pages/ArtPractice";
import { Design } from "./pages/Design";
import { FacultyCV } from "./pages/FacultyCV";
import { FacultyLanding } from "./pages/FacultyLanding";
import { FacultyLectures } from "./pages/FacultyLectures";
import { FacultyPortfolio } from "./pages/FacultyPortfolio";
import { FacultyStudentsWorks } from "./pages/FacultyStudentsWorks";
import { Home } from "./pages/Home";
import { Research } from "./pages/Research";

// Animated page wrapper – dark fade-in, no white flash
function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{ backgroundColor: "#000000", minHeight: "100dvh" }}
    >
      {children}
    </motion.div>
  );
}

// Root layout wraps all routes with cursor context
function RootLayout() {
  const location = useLocation();

  // Global smooth scroll — geological momentum feel across all pages
  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  return (
    <CursorProvider>
      <VisibilityContextProvider>
        <CustomCursor />
        <StealthAdminClaim />
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </VisibilityContextProvider>
    </CursorProvider>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
});

const designRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/design",
  component: Design,
});

const artRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/art",
  component: Art,
});

const artPracticeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/art-practice",
  component: ArtPractice,
});

const researchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/research",
  component: Research,
});

const facultyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/faculty",
  component: FacultyLanding,
});

const facultyLecturesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/faculty/lectures",
  component: FacultyLectures,
});

const facultyStudentsWorksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/faculty/students-works",
  component: FacultyStudentsWorks,
});

const facultyPortfolioRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/faculty/portfolio",
  component: FacultyPortfolio,
});

const facultyCVRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/faculty/cv",
  component: FacultyCV,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminLogin,
});

const adminDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/dashboard",
  component: AdminDashboard,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  designRoute,
  artRoute,
  artPracticeRoute,
  researchRoute,
  facultyRoute,
  facultyLecturesRoute,
  facultyStudentsWorksRoute,
  facultyPortfolioRoute,
  facultyCVRoute,
  adminRoute,
  adminDashboardRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <InternetIdentityProvider>
      <RouterProvider router={router} />
    </InternetIdentityProvider>
  );
}
