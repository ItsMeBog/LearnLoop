const handleFileUpload = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setIsLoading(true);

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = "";
    const pageLimit = Math.min(pdf.numPages, 10);

    for (let pageNumber = 1; pageNumber <= pageLimit; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      fullText += content.items.map((item) => item.str).join(" ");
      fullText += "\n\n";
    }

    if (!fullText.trim()) {
      throw new Error("No readable text found in PDF.");
    }

    // ✅ FIXED HERE (Netlify function)
    const response = await fetch(
      "/.netlify/functions/generate-study-material",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: fullText }),
      },
    );

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
                answer: "Try another PDF or check your AI backend.",
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
    console.error("PDF/AI Error:", error);
    alert(error.message || "Error processing PDF.");
  } finally {
    setIsLoading(false);
  }
};
