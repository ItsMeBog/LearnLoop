import React, { useState } from "react";
import {
  Sparkles,
  Upload,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  X,
  FileText,
  Loader2,
  Trash2,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import mammoth from "mammoth";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const defaultData = {
  flashcards: [
    {
      question: "Upload a file to start!",
      answer: "Your AI-generated answers will appear here.",
    },
  ],
  quiz: [],
};

const StudyMaterial = () => {
  const [view, setView] = useState("flashcards");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [data, setData] = useState(defaultData);

  const handleClear = () => {
    setData(defaultData);
    setCurrentCard(0);
    setIsFlipped(false);
    setSelectedAnswers({});
    setView("flashcards");
  };

  const extractPdfText = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = "";
    const pageLimit = Math.min(pdf.numPages, 10);

    for (let pageNumber = 1; pageNumber <= pageLimit; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      fullText += content.items.map((item) => item.str).join(" ");
      fullText += "\n\n";
    }

    return fullText;
  };

  const extractDocxText = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);

    try {
      let fullText = "";
      const fileName = file.name.toLowerCase();

      const isPdf =
        file.type === "application/pdf" || fileName.endsWith(".pdf");

      const isDocx =
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        fileName.endsWith(".docx");

      if (isPdf) {
        fullText = await extractPdfText(file);
      } else if (isDocx) {
        fullText = await extractDocxText(file);
      } else {
        throw new Error(
          "Unsupported file type. Please upload a PDF or DOCX file.",
        );
      }

      if (!fullText.trim()) {
        throw new Error("No readable text found in the uploaded file.");
      }

      const API_BASE =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

      const response = await fetch(`${API_BASE}/api/generate-study-material`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: fullText }),
      });

      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error("Server returned invalid response.");
      }

      if (!response.ok) {
        throw new Error(result?.error || "Failed to generate study material.");
      }

      setData({
        flashcards:
          result.flashcards?.length > 0
            ? result.flashcards
            : [
                {
                  question: "No flashcards generated",
                  answer: "Try another file or check your AI backend.",
                },
              ],
        quiz: result.quiz || [],
      });

      setSelectedAnswers({});
      setCurrentCard(0);
      setIsFlipped(false);
      setView("flashcards");
      setIsModalOpen(false);
    } catch (error) {
      console.error("File/AI Error:", error);
      alert(error.message || "Error processing file.");
    } finally {
      setIsLoading(false);
      e.target.value = "";
    }
  };

  const nextCard = () => {
    if (currentCard < data.flashcards.length - 1) {
      setCurrentCard((prev) => prev + 1);
      setIsFlipped(false);
    }
  };

  const prevCard = () => {
    if (currentCard > 0) {
      setCurrentCard((prev) => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleSelectAnswer = (questionIndex, option) => {
    if (selectedAnswers[questionIndex]) return;

    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: option,
    }));
  };

  const getOptionClass = (questionIndex, option, correctAnswer) => {
    const selected = selectedAnswers[questionIndex];

    if (!selected) {
      return "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer";
    }

    if (option === correctAnswer) {
      return "bg-green-50 border-green-300 text-green-700";
    }

    if (option === selected && option !== correctAnswer) {
      return "bg-red-50 border-red-300 text-red-700";
    }

    return "bg-slate-50 border-slate-200 text-slate-400";
  };

  const hasGeneratedContent =
    data.flashcards.length > 1 ||
    data.quiz.length > 0 ||
    data.flashcards[0]?.question !== defaultData.flashcards[0].question;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen font-sans selection:bg-teal-100">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 md:mb-10 gap-4 text-center sm:text-left">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Quiz & Flashcards
          </h1>
          <p className="text-[10px] md:text-sm text-gray-500 font-medium italic">
            Transform documents into interactive study sets
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {hasGeneratedContent && (
            <button
              onClick={handleClear}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-500 text-white px-5 py-3 rounded-2xl hover:bg-red-600 shadow-lg shadow-red-100 transition-all active:scale-95 text-sm"
            >
              <Trash2 size={16} />
              <span className="font-bold">Clear</span>
            </button>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-teal-600 text-white px-5 py-3 rounded-2xl hover:bg-teal-700 shadow-lg shadow-teal-100 transition-all active:scale-95 text-sm"
          >
            <Sparkles size={16} />
            <span className="font-bold">Generate from File</span>
          </button>
        </div>
      </div>

      <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-fit mb-8 border border-slate-200">
        <button
          onClick={() => setView("flashcards")}
          className={`flex-1 sm:flex-none px-6 md:px-10 py-2 rounded-lg font-bold text-xs md:text-sm transition-all ${
            view === "flashcards"
              ? "bg-white shadow-sm text-teal-600"
              : "text-slate-500"
          }`}
        >
          Flashcards
        </button>
        <button
          onClick={() => setView("quiz")}
          className={`flex-1 sm:flex-none px-6 md:px-10 py-2 rounded-lg font-bold text-xs md:text-sm transition-all ${
            view === "quiz"
              ? "bg-white shadow-sm text-teal-600"
              : "text-slate-500"
          }`}
        >
          Quiz
        </button>
      </div>

      {view === "flashcards" && (
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-10 shadow-sm relative">
          <div className="flex justify-between items-center mb-6 md:mb-10">
            <p className="text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-widest">
              Card {currentCard + 1} of {data.flashcards.length}
            </p>
            <span className="bg-teal-50 text-teal-600 px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-tighter border border-teal-100">
              AI Powered
            </span>
          </div>

          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="h-64 md:h-80 w-full mb-8 md:mb-10 cursor-pointer perspective-[1000px]"
          >
            <div
              className={`relative w-full h-full transition-all duration-500 transform-3d ${
                isFlipped ? "transform-[rotateY(180deg)]" : ""
              }`}
            >
              <div className="absolute inset-0 backface-hidden bg-slate-50 border border-slate-100 rounded-3xl flex flex-col items-center justify-center p-6 md:p-12 text-center">
                <h2 className="text-lg md:text-2xl font-bold text-slate-800 leading-tight">
                  {data.flashcards[currentCard]?.question}
                </h2>
                <p className="mt-6 text-teal-500 text-[10px] font-bold uppercase tracking-widest animate-pulse">
                  Click to flip
                </p>
              </div>

              <div className="absolute inset-0 backface-hidden transform-[rotateY(180deg)] bg-white border-2 border-teal-50 rounded-3xl flex flex-col items-center justify-center p-6 md:p-12 text-center shadow-inner">
                <p className="text-sm md:text-lg text-slate-700 leading-relaxed font-medium italic">
                  {data.flashcards[currentCard]?.answer}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <button
              disabled={currentCard === 0}
              onClick={prevCard}
              className="p-3 md:p-4 border border-slate-200 rounded-xl md:rounded-2xl hover:bg-slate-50 disabled:opacity-20 transition-colors text-slate-600"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="flex items-center gap-2 font-black text-slate-400 hover:text-teal-600 transition-all text-[10px] md:text-xs uppercase tracking-widest"
            >
              <RotateCw size={14} /> Flip
            </button>

            <button
              disabled={currentCard === data.flashcards.length - 1}
              onClick={nextCard}
              className="p-3 md:p-4 border border-slate-200 rounded-xl md:rounded-2xl hover:bg-slate-50 disabled:opacity-20 transition-colors text-slate-600"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {view === "quiz" && (
        <div className="space-y-4">
          {data.quiz.length > 0 ? (
            data.quiz.map((item, index) => {
              const selected = selectedAnswers[index];
              const isAnswered = Boolean(selected);

              return (
                <div
                  key={index}
                  className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm"
                >
                  <h3 className="text-lg font-bold text-slate-900 mb-4">
                    {index + 1}. {item.question}
                  </h3>

                  <div className="grid gap-3">
                    {item.options?.map((option, optionIndex) => (
                      <button
                        key={optionIndex}
                        type="button"
                        onClick={() => handleSelectAnswer(index, option)}
                        disabled={isAnswered}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${getOptionClass(
                          index,
                          option,
                          item.correctAnswer,
                        )}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>

                  {isAnswered && (
                    <div className="mt-4 space-y-2">
                      <p
                        className={`text-sm font-bold ${
                          selected === item.correctAnswer
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {selected === item.correctAnswer
                          ? "Correct answer!"
                          : "Wrong answer."}
                      </p>
                      <p className="text-sm text-slate-700">
                        <span className="font-bold">Your answer:</span>{" "}
                        {selected}
                      </p>
                      <p className="text-sm text-green-700">
                        <span className="font-bold">Correct answer:</span>{" "}
                        {item.correctAnswer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-400">
              No quiz generated yet.
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-100">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-teal-50/30">
              <h2 className="text-lg md:text-xl font-bold text-teal-900">
                Auto-Generate
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white rounded-full transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <label className="relative border-2 border-dashed border-slate-200 rounded-2xl p-8 md:p-12 flex flex-col items-center justify-center hover:border-teal-400 hover:bg-teal-50/20 transition-all cursor-pointer group">
                <input
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                {isLoading ? (
                  <Loader2
                    className="animate-spin text-teal-500 mb-4"
                    size={40}
                  />
                ) : (
                  <Upload
                    className="text-slate-300 group-hover:text-teal-500 mb-4 transition-colors"
                    size={40}
                  />
                )}
                <p className="font-bold text-slate-700 text-sm text-center">
                  {isLoading
                    ? "Reading file and generating questions..."
                    : "Tap to upload PDF or Word file"}
                </p>
              </label>

              <div className="mt-6 bg-teal-50/50 border border-teal-100 p-4 rounded-xl flex gap-3">
                <FileText className="text-teal-500 shrink-0" size={18} />
                <p className="text-[11px] md:text-xs text-teal-800 leading-tight">
                  <b>Note:</b> AI will scan the PDF or DOCX content and generate
                  flashcards and quiz questions automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyMaterial;
