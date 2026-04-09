import { useNavigate } from "react-router-dom";
import "./App.css";
import logo from "./Images/Hams.png";
import hams1 from "./Images/Hams1.png";
import dashboardPreview from "./Images/Dashboard.png";

function Landing() {
  const navigate = useNavigate();

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div
            onClick={() => navigate("/")}
            className="flex items-center gap-4 cursor-pointer"
          >
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-teal-50 flex items-center justify-center shadow-sm">
              <img
                src={logo}
                alt="Logo"
                className="w-15 h-15 md:w-12 md:h-12 object-contain"
              />
            </div>

            <h1 className="text-2xl font-bold text-teal-600">LearnLoop</h1>
          </div>

          <nav className="hidden md:flex gap-10">
            <a
              href="#study-materials"
              className="font-medium hover:text-teal-600 transition-colors"
            >
              Study Materials
            </a>
            <a
              href="#features"
              className="font-medium hover:text-teal-600 transition-colors"
            >
              Features
            </a>
          </nav>

          <button
            onClick={() => navigate("/login")}
            className="bg-teal-500 text-white px-5 py-2 rounded-lg font-medium hover:bg-teal-600 shadow-md"
          >
            Login
          </button>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
        <div className="p-4 md:p-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Welcome to LearnLoop—
            <br />
            Where Learning Soars!
          </h2>

          <p className="mb-4 text-gray-600 text-lg">
            LearnLoop is your dedicated space for academic excellence. Here,
            we&apos;ve curated the finest online study tools to elevate your
            learning experience.
          </p>

          <p className="mb-8 text-gray-600">
            Embark on a journey with LearnLoop, where learning is not just a
            task but a rewarding adventure.
          </p>

          <button
            onClick={() => navigate("/login")}
            className="inline-block bg-teal-500 text-white px-8 py-3 rounded-lg font-bold hover:bg-teal-600 shadow-lg"
          >
            Join Us
          </button>
        </div>

        <img
          src={hams1}
          alt="LearnLoop Mascot"
          className="w-72.5 md:w-92.5 lg:w-102.5 object-contain drop-shadow-xl"
        />
      </section>

      <section
        id="study-materials"
        className="bg-cyan-50 py-20 text-center scroll-mt-20"
      >
        <div className="max-w-6xl mx-auto px-6">
          <h3 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">
            Study Materials
          </h3>

          <p className="text-gray-600 text-lg mb-10 leading-relaxed max-w-3xl mx-auto">
            Give students a quick look at what&apos;s inside the system. From
            dashboard insights to tasks, subjects, notes, and smart study tools,
            LearnLoop helps students stay organized, focused, and motivated.
          </p>

          <div className="max-w-5xl mx-auto bg-white rounded-4xl shadow-2xl border border-cyan-100 overflow-hidden">
            <div className="bg-gray-100 border-b border-gray-200 px-4 md:px-6 py-3 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                <span className="w-3 h-3 rounded-full bg-green-400"></span>
              </div>

              <div className="flex-1 flex justify-center">
                <div className="bg-white border border-gray-200 rounded-full px-4 py-2 text-xs md:text-sm text-gray-400 w-[70%] max-w-xl text-left shadow-sm">
                  https://learnloop.site/dashboard
                </div>
              </div>
            </div>

            <div className="p-4 md:p-6 bg-white">
              <img
                src={dashboardPreview}
                alt="LearnLoop Dashboard Preview"
                className="w-full rounded-2xl shadow-lg border border-gray-100"
              />
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-cyan-100 p-5 text-left">
              <h4 className="font-bold text-gray-800 mb-2">Track Everything</h4>
              <p className="text-sm text-gray-600">
                Monitor tasks, exams, subjects, and progress in one organized
                dashboard.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-cyan-100 p-5 text-left">
              <h4 className="font-bold text-gray-800 mb-2">Study Smarter</h4>
              <p className="text-sm text-gray-600">
                Turn PDF materials into AI-generated flashcards and quiz
                questions.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-cyan-100 p-5 text-left">
              <h4 className="font-bold text-gray-800 mb-2">Stay Focused</h4>
              <p className="text-sm text-gray-600">
                Use planner, countdown, and focus tools to build better study
                habits.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate("/login")}
            className="inline-block mt-10 bg-teal-500 text-white px-8 py-4 rounded-xl font-bold hover:bg-teal-600 shadow-md"
          >
            Get Started
          </button>
        </div>
      </section>

      <section
        id="features"
        className="max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-10 items-center scroll-mt-20"
      >
        <div>
          <h3 className="text-3xl font-bold mb-6">Features</h3>
          <p className="text-gray-600 text-lg mb-6 leading-relaxed">
            Our platform is not just a tool; it&apos;s your passport to a world
            of academic excellence.
          </p>
          <ul className="space-y-4">
            <li className="flex items-center gap-3 text-gray-700 font-medium">
              <span className="text-teal-500 text-xl">✓</span> Personal Study
              Hubs
            </li>
            <li className="flex items-center gap-3 text-gray-700 font-medium">
              <span className="text-teal-500 text-xl">✓</span> Interactive
              Learning Hubs
            </li>
            <li className="flex items-center gap-3 text-gray-700 font-medium">
              <span className="text-teal-500 text-xl">✓</span> Effortless
              Progress Tracking
            </li>
            <li className="flex items-center gap-3 text-gray-700 font-medium">
              <span className="text-teal-500 text-xl">✓</span> Innovative
              Learning Tools
            </li>
            <li className="flex items-center gap-3 text-gray-700 font-medium">
              <span className="text-teal-500 text-xl">✓</span> AI Quiz &
              Flashcards from PDF
            </li>
            <li className="flex items-center gap-3 text-gray-700 font-medium">
              <span className="text-teal-500 text-xl">✓</span> Study Planner and
              Focus Mode
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
          <h4 className="text-2xl font-bold text-gray-800 mb-4">
            Why Students Will Love It
          </h4>
          <p className="text-gray-600 leading-relaxed mb-4">
            LearnLoop gives students one place to manage school life—track
            deadlines, organize subjects, create notes, upload study materials,
            and prepare smarter with AI-generated quizzes and flashcards.
          </p>
          <p className="text-gray-600 leading-relaxed">
            It&apos;s built to make studying more organized, more visual, and
            more motivating for everyday use.
          </p>
        </div>
      </section>

      <footer className="bg-teal-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm text-teal-100 opacity-80">
            © 2026 LearnLoop. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}

export default Landing;
