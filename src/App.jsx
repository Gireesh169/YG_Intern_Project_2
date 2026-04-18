import { Routes, Route, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import TeacherQuizManagement from "./pages/admin/teacher-quiz-management/TeacherQuizManagement";

/* ================= COMMON ================= */
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";
import NotFoundPage from "./components/common/NotFoundPage";
import ScrollToTop from "./components/ScrollToTop";

/* ================= AUTH ================= */
import OpenRoute from "./components/auth/Openroute";
import PrivateRoute from "./components/auth/Privateroute";
import AdminRoute from "./components/auth/AdminRoute";

/* ================= PUBLIC ================= */
import Homepage from "./pages/Homepage";
import ContactUs from "./pages/ContactUs";

/* ================= USER ================= */
import Dashboard from "./pages/Dashboard";
import CourseDetail from "./pages/CourseDetail";
import QuizInterface from "./pages/QuizInterface";
import LearningQuiz from "./pages/LearningQuiz";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";

/* ================= PAYMENTS ================= */
import PaymentForm from "./pages/payments/PaymentForm";
import PaymentSuccessPage from "./pages/payments/PaymentSuccessPage";
import PaymentFailurePage from "./pages/payments/PaymentFailurePage";

/* ================= ADMIN ================= */
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAnalyticsDashboard from "./pages/admin/performance-analytics/AdminAnalyticsDashboard";


/* ===== Admin → Content Management ===== */
import AdminGradeSubjectOverview from "./pages/admin/content_management/AdminGradeSubjectOverview";
import SubjectList from "./pages/admin/content_management/Subject";
import ModuleList from "./pages/admin/content_management/Module";
import SubModuleList from "./pages/admin/content_management/SubModule";

/* ===== Admin → Performance Analytics ===== */
import AdminStudentPerformance from "./pages/admin/performance-analytics/AdminStudentCoverageOverview";

/* ================= AUTH STATE (UNCHANGED) ================= */
import { setSignupData } from "./slices/authSlice";
import { supabase } from "./config/supabase";
import QuizHistory from "./pages/QuizHistory";
import QuestionList from "./pages/admin/Questionhandler/AdminReviewPage";
import AdminReviewPage from "./pages/admin/Questionhandler/AdminReviewPage";
import Chat from "./pages/Chat";
import AdminChatPage from "./pages/AdminChatPage";
import ChatToggleButton from "./components/chat/ChatToggleButton";


function App() {
  const location = useLocation();
  const dispatch = useDispatch();

  /* Routes where header should be hidden */
  const noHeaderRoutes = ["/course"];
  const shouldShowHeader = !noHeaderRoutes.some((route) =>
    location.pathname.startsWith(route)
  );

  // 🔐 Your auth logic remains untouched (still commented)
  // useEffect(() => {
  //   ...
  // }, [dispatch]);

  useEffect(() => {
    const syncAuthenticatedUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.error("Failed to fetch authenticated user:", error);
          return;
        }

        const user = data?.user;
        if (!user) return;

        const googleId =
          user.user_metadata?.google_id ||
          user.user_metadata?.sub ||
          user.user_metadata?.provider_id ||
          user.id;

        const payload = {
          id: user.id,
          google_id: googleId,
          email: user.email,
          name: user.user_metadata?.full_name || "User",
          picture: user.user_metadata?.avatar_url || "",
        };

        const { error: upsertError } = await supabase
          .from("users")
          .upsert(payload, { onConflict: "id" });

        if (upsertError) {
          console.error("Failed to upsert user into public.users:", upsertError);
        }
      } catch (err) {
        console.error("Unexpected error while syncing user:", err);
      }
    };

    syncAuthenticatedUser();
  }, []);


  return (
    <>
      <ScrollToTop />
      {shouldShowHeader && <Header />}


    <ChatToggleButton />
      <Routes>
        {/* ================= PUBLIC ================= */}
        <Route path="/" element={<Homepage />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/admin/review/:subModuleId" element={<AdminReviewPage />} />

        {/* ================= USER ================= */}
        <Route
          path="/courses/:courseName/:courseId"
          element={
            <PrivateRoute>
              <CourseDetail />
            </PrivateRoute>
          }
        />

        <Route
          path="/quizzes"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/learn/:subjectId"
          element={
            <PrivateRoute>
              <LearningQuiz />
            </PrivateRoute>
          }
        />

        <Route path="/course/:subjectId/:submoduleId" element={<QuizInterface />} />

        {/* quiz history*/}
        <Route path="/quiz-history" element={<QuizHistory />} />

        {/* ================= USER ANALYTICS ================= */}
        <Route
          path="/analytics"
          element={
            <PrivateRoute>
              <AnalyticsDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/courses/view-stats/:subModuleId"
          element={
            <PrivateRoute>
              <AnalyticsDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/courses/subject-stats/:subjectId"
          element={
            <PrivateRoute>
              <AnalyticsDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/courses/chapter-stats/:chapterId"
          element={
            <PrivateRoute>
              <AnalyticsDashboard />
            </PrivateRoute>
          }
        />

        {/* ================= ADMIN ================= */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/performance-analytics"
          element={
            <AdminRoute>
              <AdminAnalyticsDashboard />
            </AdminRoute>
          }
        />

         <Route
          path="/admin/teacher-quiz-management"
          element={
            <AdminRoute>
              <TeacherQuizManagement />
            </AdminRoute>
          }
        />

        {/* ===== Admin → Content Management ===== */}
        {/* ===== Admin → Content Management ===== */}

        <Route
          path="/admin/grades"
          element={
            <AdminRoute>
              <AdminGradeSubjectOverview />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/subjects"
          element={
            <AdminRoute>
              <SubjectList />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/courses/:courseName"
          element={
            <AdminRoute>
              <ModuleList />
            </AdminRoute>
          }
        />


        <Route
          path="/admin/courses/modules/:moduleName"
          element={
            <AdminRoute>
              <SubModuleList />
            </AdminRoute>
          }
        />



        {/* ===== Student → Quiz ===== */}
        <Route path="/course/:subjectId/:submoduleId" element={<QuizInterface />} />


        {/* ===== Admin → Performance Analytics ===== */}
        <Route
          path="/admin/performance"
          element={
            <AdminRoute>
              <AdminStudentPerformance />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/performance-analytics"
          element={<AdminAnalyticsDashboard />}
        />


        {/* ================= PAYMENTS ================= */}
        <Route path="/payment" element={<PaymentForm />} />
        <Route path="/payment-success" element={<PaymentSuccessPage />} />
        <Route path="/payment-failure" element={<PaymentFailurePage />} />

        {/* ================= FALLBACK ================= */}
        <Route path="*" element={<NotFoundPage />} />
        <Route path="/chat" element={<Chat />} />
<Route path="/admin/chat" element={<AdminChatPage />} />
      </Routes>

      <Footer />
    </>
  );
}

export default App;




