import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, Trash2, Edit2, EyeOff, Eye, Plus } from "lucide-react";
import { supabaseService } from "../services/supabaseService";
import toast from "react-hot-toast";

const QuizEditPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubmodule, setSelectedSubmodule] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null); // Track which question is being edited

  // Fetch Subjects on Load
  useEffect(() => {
    const fetchInitialData = async () => {
      const res = await supabaseService.getSubjects();
      setSubjects(res.subjects || []);
    };
    fetchInitialData();
  }, []);

  // Fetch Questions when a submodule is chosen
  const loadQuestions = async (subId) => {
    setLoading(true);
    try {
      const res = await supabaseService.getSubModuleWithQuestions(subId);
      setQuestions(res.questions || []);
      setSelectedSubmodule(subId);
    } catch (err) {
      toast.error("Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (qId, updatedData) => {
    try {
      await supabaseService.updateQuestion(qId, updatedData);
      toast.success("Question updated successfully!");
      setEditingId(null);
      loadQuestions(selectedSubmodule); // Refresh list
    } catch (err) {
      toast.error("Update failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#E5E7EB] p-8 pt-24">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold">Quiz <span className="text-rose-500">Editor</span></h1>
            <p className="text-gray-500 text-sm">Modify questions, choices, and explanations.</p>
          </div>
          {selectedSubmodule && (
            <button 
              onClick={() => setSelectedSubmodule(null)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={18} /> Change Chapter
            </button>
          )}
        </header>

        {!selectedSubmodule ? (
          /* STEP 1: SELECT SUBJECT/SUBMODULE (Simplified Placeholder) */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {subjects.map(sub => (
              <div 
                key={sub.id} 
                onClick={() => loadQuestions(sub.id)} // In real use, navigate deeper to submodules
                className="p-6 bg-[#111827] border border-[#1F2937] rounded-2xl hover:border-rose-500/50 cursor-pointer transition-all"
              >
                <h3 className="font-bold">{sub.name}</h3>
                <p className="text-xs text-gray-500 mt-2">Click to manage questions</p>
              </div>
            ))}
          </div>
        ) : (
          /* STEP 2: EDIT QUESTIONS LIST */
          <div className="space-y-6">
            {questions.map((q, index) => (
              <div key={q.id} className="bg-[#111827] border border-[#1F2937] rounded-3xl p-6 shadow-xl">
                {editingId === q.id ? (
                  /* EDIT MODE FORM */
                  <div className="space-y-4">
                    <textarea 
                      className="w-full bg-[#0B0F19] border border-[#1F2937] p-3 rounded-xl focus:border-rose-500 outline-none"
                      defaultValue={q.question_text}
                      id={`text-${q.id}`}
                    />
                    <div className="flex gap-4">
                      <button 
                        onClick={() => {
                          const text = document.getElementById(`text-${q.id}`).value;
                          handleUpdate(q.id, { body: text });
                        }}
                        className="flex items-center gap-2 bg-rose-600 px-4 py-2 rounded-xl font-bold text-sm"
                      >
                        <Save size={16} /> Save Changes
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-gray-500 text-sm">Cancel</button>
                    </div>
                  </div>
                ) : (
                  /* VIEW MODE */
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <span className="text-[10px] font-bold text-rose-500 uppercase">Question {index + 1}</span>
                      <p className="text-lg mt-1 font-medium">{q.question_text}</p>
                      <div className="mt-4 flex gap-2">
                        {q.options?.map((opt, i) => (
                          <span key={i} className={`text-xs px-3 py-1 rounded-full ${opt.isCorrect ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-gray-800 text-gray-400'}`}>
                            {typeof opt === 'string' ? opt : opt.optionText}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button 
                      onClick={() => setEditingId(q.id)}
                      className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      <Edit2 size={18} className="text-rose-400" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizEditPage;