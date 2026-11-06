// DOM elements
const quizQuestionBox = document.querySelector(".quizQuestionBox")
const showSavedButton = document.getElementById("show-saved-button")
const savedQuestionsBox = document.getElementById("saved-questions-box")
const quizSubjectInput = document.getElementById("quiz-subject-input")
const generateQuizButton = document.getElementById("generate-quiz-button")
const scoreDisplay = document.getElementById("score-display")

// State
let quizCompleted = false
let currentQuestionIndex = 0;
let savedQuestions = [];
let quizData = [];

// Answer history storage
const QUIZ_HISTORY_KEY = "quizHistory"
const QUIZ_DATA_KEY = "quizData"
const QUIZ_STATE_KEY = "quizState"
const SAVED_QUESTIONS_KEY = "savedQuestions"
let quizHistory = loadQuizHistory()
let isGenerated = false;

if (quizData.length === 0) {
    quizQuestionBox.innerHTML = "<p class='noQuizMessage'>No quiz yet.</p>"
}

// Restore state from sessionStorage
currentQuestionIndex = Number(sessionStorage.getItem(QUIZ_STATE_KEY)) || 0;
savedQuestions = JSON.parse(sessionStorage.getItem(SAVED_QUESTIONS_KEY)) || [];

// Escape HTML to prevent XSS attacks
function escapeHtml(text) {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
}
let subject = "";
// Fetch quiz questions from API
async function fetchQuizQuestions() {

    if (!subject) {
        alert("please write subject")
        return null
    }

    try {
        const controller = new AbortController();

        const timeoutId = setTimeout(() => {
            controller.abort()
            alert("please try another time or check your connection")
            renderQuizQuestion()
        }, 7000)

        const url = `api.php?suj=${encodeURIComponent(subject)}`

        const response = await fetch(url, controller.signal)

        const data = await response.json()

        if (response.ok) {
            clearTimeout(timeoutId)

            // Reset all state and sessionStorage for a clean start
            sessionStorage.removeItem(QUIZ_DATA_KEY)
            sessionStorage.removeItem(QUIZ_HISTORY_KEY)
            sessionStorage.removeItem(QUIZ_STATE_KEY)
            quizHistory = {};
            quizData = [];
            currentQuestionIndex = 0;
            quizCompleted = false;
        }

        return data
    } catch (error) {
        isGenerated = false
        alert("please try another time")
        controller.abort()
        return null
    }
}

// Fisher-Yates shuffle algorithm
function shuffle(items) {
    for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
}

// Render current question, choices, and nav buttons
function renderQuizQuestion() {
    const quiz = quizData[currentQuestionIndex]
    if (!quiz) return



    const questionId = getQuestionId(quiz, currentQuestionIndex)

    quizQuestionBox.innerHTML = `
            <h2 class="question">
                <p>Q${currentQuestionIndex + 1}-${escapeHtml(quiz.question)}</p>
                <button id="save-question-button">Save</button>
            </h2>
    `

    // Create answer choices in their saved order
    quiz.choices.forEach((choice, index) => {
        const optionElement = document.createElement("div");
        optionElement.className = "quiz-option";
        optionElement.id = `answer-option-${index}`
        optionElement.textContent = choice;
        optionElement.addEventListener("click", () => checkAnswer(optionElement.id, quiz.correctAnswer))
        quizQuestionBox.appendChild(optionElement);
    });

    // Create before/next navigation buttons
    const navigationBox = document.createElement("div");
    navigationBox.className = "nav-buttons"

    const previousButton = document.createElement("button")
    previousButton.id = "previous-question-button"

    previousButton.textContent = "before"
    const nextButton = document.createElement("button")

    nextButton.id = "next-question-button"
    nextButton.textContent = "next"

    nextButton.addEventListener("click", () => navigateQuiz("next"))
    previousButton.addEventListener("click", () => navigateQuiz("previous"))
    navigationBox.append(previousButton, nextButton)
    quizQuestionBox.append(navigationBox)

    applyAnswerReview(questionId)
    updateScore()
}


// Generate quiz on button click
generateQuizButton.onclick = async () => {
    subject = quizSubjectInput.value.trim()

    if (!subject) {
        alert("please write subject")
        return
    }

    quizSubjectInput.value = ""

    quizQuestionBox.innerHTML = "<p class='generatingMessage'>Generating...</p>"

    const dataFetch = await fetchQuizQuestions()

    if(!dataFetch || !Array.isArray(dataFetch)) return

    quizData = dataFetch

    if (!quizData) {
        quizQuestionBox.innerHTML = "";
        return
    }

    quizQuestionBox.style = ""

    // Shuffle each question once and persist that order for later review
    if (Array.isArray(quizData)) {
        quizData.forEach(quiz => shuffle(quiz.choices))
        persistQuizData()
    }

    sessionStorage.setItem(QUIZ_STATE_KEY, currentQuestionIndex)

    renderQuizQuestion()

}

// Navigate between questions
function navigateQuiz(direction) {
    if (direction === "next" && currentQuestionIndex < quizData.length - 1) {
        currentQuestionIndex++
    } else if (direction === "previous" && currentQuestionIndex > 0) {
        currentQuestionIndex--
    } else {
        return
    }

    sessionStorage.setItem(QUIZ_STATE_KEY, currentQuestionIndex)
    renderQuizQuestion()
}

// Check user answer and provide feedback
function checkAnswer(id, correctAnswer) {

    const selectedOption = document.getElementById(id)

    if (correctAnswer === selectedOption.textContent) {
        selectedOption.style.background = "green"
    } else {
        selectedOption.style.background = "red"
    }

    selectedOption.style.color = "#000"
    selectedOption.style.border = "none"

    CompletedQuiz()
}

function CompletedQuiz() {
    if (currentQuestionIndex === quizData.length - 1) {
        quizCompleted = true;
        setTimeout(() => {
            alert(`Quiz Completed! Your final score is ${scoreDisplay.textContent.split(": ")[1]}`);
        }, 1000);
    } else {
        // Auto-advance to next question after 1 second
        setTimeout(() => {
            currentQuestionIndex++
            sessionStorage.setItem(QUIZ_STATE_KEY, currentQuestionIndex)
            renderQuizQuestion()
        }, 1000)
    }
}

// Answer history and score
function loadQuizHistory() {
    try {
        const storedHistory = JSON.parse(sessionStorage.getItem(QUIZ_HISTORY_KEY) || "{}")
        if (!storedHistory || Array.isArray(storedHistory)) return {}

        return storedHistory
    } catch (error) {
        return {}
    }
}

function persistQuizHistory() {
    try {
        sessionStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify(quizHistory))
    } catch (error) {
    }
}

function loadQuizData() {
    try {
        const storedQuizData = JSON.parse(sessionStorage.getItem(QUIZ_DATA_KEY) || "null")
        if (!Array.isArray(storedQuizData) || storedQuizData.length === 0) return null

        const isValidQuizData = storedQuizData.every(quiz =>
            quiz &&
            typeof quiz.question === "string" &&
            Array.isArray(quiz.choices) &&
            quiz.choices.length > 0 &&
            quiz.choices.every(choice => typeof choice === "string") &&
            typeof quiz.correctAnswer === "string" &&
            quiz.choices.includes(quiz.correctAnswer)
        )


        return isValidQuizData ? storedQuizData : null
    } catch (error) {
        return null
    }
}

function persistQuizData() {
    try {
        sessionStorage.setItem(QUIZ_DATA_KEY, JSON.stringify(quizData))
    } catch (error) {
        console.log("Could not save quiz data", error)
    }
}

function getQuestionId(quiz, index) {
    return `q${index}:${quiz.question}`
}

function updateScore() {
    if (!scoreDisplay) return

    const totalQuestions = Array.isArray(quizData) ? quizData.length : 0
    const correctAnswers = totalQuestions === 0
        ? 0
        : quizData.reduce((correctCount, quiz, index) => {
            const answerRecord = quizHistory[getQuestionId(quiz, index)]
            return answerRecord && answerRecord.isCorrect ? correctCount + 1 : correctCount
        }, 0)

    scoreDisplay.textContent = `Score : ${correctAnswers} / ${totalQuestions}`
}

function clearAnswerHighlights() {
    quizQuestionBox.querySelectorAll(".quiz-option").forEach(option => {
        option.classList.remove("answer-correct", "answer-wrong")
        option.style.background = ""
        option.style.color = ""
        option.style.border = ""
    })
}

function applyAnswerReview(questionId) {
    clearAnswerHighlights()

    const answerRecord = quizHistory[questionId]
    if (!answerRecord) return

    quizQuestionBox.querySelectorAll(".quiz-option").forEach(option => {
        if (option.textContent === answerRecord.correctAnswer) {
            option.classList.add("answer-correct")
        }

        if (!answerRecord.isCorrect && option.textContent === answerRecord.selectedAnswer) {
            option.classList.add("answer-wrong")
        }

        option.style.pointerEvents = "none";
    })
}

function recordAnswer(quiz, questionId, selectedOption) {
    const selectedAnswer = selectedOption.textContent

    quizHistory[questionId] = {
        questionId,
        selectedAnswer,
        correctAnswer: quiz.correctAnswer,
        isCorrect: selectedAnswer === quiz.correctAnswer
    }

    persistQuizHistory()
    applyAnswerReview(questionId)
    updateScore()
}

// Save current question to sessionStorage
function saveCurrentQuestion() {
    const questionText = quizQuestionBox.querySelector("h2 p").textContent
    if (!savedQuestions.includes(questionText)) {
        savedQuestions.push(questionText)
        sessionStorage.setItem(SAVED_QUESTIONS_KEY, JSON.stringify(savedQuestions))
        renderSavedQuestions()
        alert("Question saved")
    } else {
        alert("Question already saved")
    }
}

// Show saved questions box
showSavedButton.onclick = () => {
    savedQuestionsBox.style.animation = "show-box 0.5s ease forwards"
}

// Event delegation: save button and answer history
quizQuestionBox.addEventListener("click", (event) => {
    if (event.target.id === "save-question-button") {
        saveCurrentQuestion()
        return
    }

    const option = event.target.closest(".quiz-option")
    if (!option || !quizData || !quizData[currentQuestionIndex]) return

    recordAnswer(
        quizData[currentQuestionIndex],
        getQuestionId(quizData[currentQuestionIndex], currentQuestionIndex),
        option
    )
})

// Event delegation: close and delete buttons in saved questions box
savedQuestionsBox.addEventListener("click", (event) => {
    if (event.target.id === "close-saved-questions-button") closeSavedQuestionsBox()
    if (event.target.classList.contains("delete-saved-question-button")) {
        const questionIndex = Number(event.target.closest("[id^='saved-question-']").id.replace("saved-question-", ""))
        deleteSavedQuestion(questionIndex)
    }
})

// Delete a saved question by index
function deleteSavedQuestion(questionIndex) {
    savedQuestions.splice(questionIndex, 1)
    sessionStorage.setItem(SAVED_QUESTIONS_KEY, JSON.stringify(savedQuestions))
    renderSavedQuestions()
}

// Render all saved questions into the saved questions box
function renderSavedQuestions() {
    savedQuestionsBox.innerHTML = `<input type="button" id="close-saved-questions-button" value="✖">`

    if (savedQuestions.length === 0) {
        savedQuestionsBox.innerHTML += "<p class='noSavedQuestionsMessage'>No saved questions yet.</p>"
        return
    }
    savedQuestions.forEach((savedQuestion, index) => {
        savedQuestionsBox.innerHTML += `
            <div id="saved-question-${index}">
                <h3 class="questionTitleSaved" style='color: #fff'>${escapeHtml(savedQuestion)}</h3>
                <button class="delete-saved-question-button">delete</button>
            </div>
        `
    })
}

    const storedQuizData = loadQuizData()
    if (storedQuizData) {
        quizData = storedQuizData
        const storedQuestionIndex = Number(sessionStorage.getItem(QUIZ_STATE_KEY))
        currentQuestionIndex = Number.isInteger(storedQuestionIndex)
            ? Math.min(Math.max(storedQuestionIndex, 0), quizData.length - 1)
            : 0
        sessionStorage.setItem(QUIZ_STATE_KEY, currentQuestionIndex)
        renderQuizQuestion()
    }

renderSavedQuestions()

// Hide saved questions box with scale animation
function closeSavedQuestionsBox() {
    savedQuestionsBox.style.animation = ""
    savedQuestionsBox.style.transform = "translate(-50%,-50%) scale(0)"
}
