import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { supabaseService } from "../../services/supabaseService";
import { supabase } from "../../config/supabase";
import toast from "react-hot-toast";
import { FiX, FiAlertCircle, FiTrendingDown } from "react-icons/fi";
import { BarChart3, Users, AlertTriangle } from "lucide-react";

function QuestionMistakesModal({ submodule, onClose }) {
  const [loading, setLoading] = useState(true);
  const [mistakesData, setMistakesData] = useState([]);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    fetchMistakesData();
  }, [submodule.id]);

  const fetchMistakesData = async () => {
    try {
      setLoading(true);

      const questionsResult =
        await supabaseService.getSubModuleWithQuestions(submodule.id);

      const questionsArray = questionsResult.questions || [];
      setQuestions(questionsArray);

      if (questionsArray.length === 0) {
        setMistakesData([]);
        return;
      }

      const analyticsResult = await supabaseService.get_analytics_all();

      const mistakesMap = new Map();

      questionsArray.forEach((q) => {
        mistakesMap.set(q.id, {
          questionId: q.id,
          questionText: q.question_text || q.body || "No question text",
          totalAttempts: 0,
          incorrectCount: 0,
          correctCount: 0,
          studentsWhoMistook: new Set(),
        });
      });

      if (analyticsResult && analyticsResult.perStudent) {
        Object.entries(analyticsResult.perStudent).forEach(
          ([studentId, studentData]) => {
            const bySubmodule =
              studentData?.raw?.bySubmodule || studentData?.bySubmodule || {};

            const submoduleData = bySubmodule[submodule.id];

            if (submoduleData && submoduleData.questions) {
              Object.entries(submoduleData.questions).forEach(
                ([questionId, questionStats]) => {
                  if (mistakesMap.has(questionId)) {
                    const current = mistakesMap.get(questionId);

                    const incorrect =
                      questionStats.totalIncorrect ||
                      questionStats.incorrect ||
                      0;

                    const correct =
                      questionStats.totalCorrect ||
                      questionStats.correct ||
                      0;

                    if (incorrect > 0) {
                      current.studentsWhoMistook.add(studentId);
                    }

                    current.incorrectCount += incorrect;
                    current.correctCount += correct;
                    current.totalAttempts += incorrect + correct;

                    mistakesMap.set(questionId, current);
                  }
                }
              );
            }
          }
        );
      }

      const mistakesArray = Array.from(mistakesMap.values()).map((item) => ({
        ...item,
        uniqueStudentMistakes: item.studentsWhoMistook.size,
        mistakeRate:
          item.totalAttempts > 0
            ? ((item.incorrectCount / item.totalAttempts) * 100).toFixed(1)
            : "0.0",
      }));

      mistakesArray.sort(
        (a, b) => b.uniqueStudentMistakes - a.uniqueStudentMistakes
      );

      setMistakesData(mistakesArray);
    } catch (error) {
      console.error("Error fetching mistakes data:", error);

      toast.error("Failed to load mistakes data");

      try {
        await fetchMistakesDataDirect();
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMistakesDataDirect = async () => {
    try {
      const { data: questionsData, error: qError } = await supabase
        .from("questions")
        .select("id, body, question_text, title")
        .eq("sub_module_id", submodule.id);

      if (qError) throw qError;

      setQuestions(questionsData || []);

      if (!questionsData || questionsData.length === 0) {
        setMistakesData([]);
        return;
      }

      const questionIds = questionsData.map((q) => q.id);

      const { data: analyticsData, error: aError } = await supabase
        .from("user_qas")
        .select("question_id, google_id, is_correct")
        .in("question_id", questionIds);

      if (aError) throw aError;

      const mistakesMap = new Map();

      questionsData.forEach((q) => {
        mistakesMap.set(q.id, {
          questionId: q.id,
          questionText:
            q.question_text || q.body || q.title || "No question text",
          totalAttempts: 0,
          incorrectCount: 0,
          correctCount: 0,
          studentsWhoMistook: new Set(),
        });
      });

      analyticsData?.forEach((record) => {
        if (mistakesMap.has(record.question_id)) {
          const current = mistakesMap.get(record.question_id);

          current.totalAttempts++;

          if (record.is_correct === false) {
            current.incorrectCount++;
            current.studentsWhoMistook.add(record.google_id);
          } else if (record.is_correct === true) {
            current.correctCount++;
          }

          mistakesMap.set(record.question_id, current);
        }
      });

      const mistakesArray = Array.from(mistakesMap.values()).map((item) => ({
        ...item,
        uniqueStudentMistakes: item.studentsWhoMistook.size,
        mistakeRate:
          item.totalAttempts > 0
            ? ((item.incorrectCount / item.totalAttempts) * 100).toFixed(1)
            : "0.0",
      }));

      mistakesArray.sort(
        (a, b) => b.uniqueStudentMistakes - a.uniqueStudentMistakes
      );

      setMistakesData(mistakesArray);
    } catch (error) {
      console.error("Direct fetch also failed:", error);
      throw error;
    }
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return "No question text";

    const cleanText = text.replace(/<[^>]*>/g, "");

    if (cleanText.length <= maxLength) return cleanText;

    return cleanText.substring(0, maxLength) + "...";
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      {/* UI remains same */}
    </div>
  );
}

QuestionMistakesModal.propTypes = {
  submodule: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    subjectName: PropTypes.string,
    moduleName: PropTypes.string,
  }).isRequired,

  onClose: PropTypes.func.isRequired,
};

export default QuestionMistakesModal;