// DOM elements
const question_box = document.querySelector(".question_box")
const btnShowSaved = document.getElementById("btn_show_saved")
const savedQuestionsBox = document.getElementById("saved_questions_box")
const quizSubjectInput = document.getElementById("quizSubjectInput")
const btnGenerate = document.getElementById("btnGenerate")

// State
let completedQuiz = false
let num_quiz = 0;
let questions = [];
let data;

// Restore state from localStorage
if (!localStorage.getItem("quizState")) {
    num_quiz = 0
} else {
    num_quiz = Number(localStorage.getItem("quizState"))
}

if (!localStorage.savedQuestions) {
    questions = []
} else {
    questions = JSON.parse(localStorage.savedQuestions)
}

// Escape HTML to prevent XSS attacks
function escapeHtml(text) {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
}

// Fetch quiz data from API
async function GenerateQuiz() {
    const Subj = quizSubjectInput.value

    if(!Subj){
        alert("please write subject")
        return null
    }

    try{
        let res = await fetch(`api.php?suj=${encodeURIComponent(Subj)}`)

        res = await res.json()
        console.log(res)
        return res
    }catch(error){
        console.log(error)
        alert("please try again")
        return null
    }
}

// Fisher-Yates shuffle algorithm
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Render current question, choices, and nav buttons
async function displayQuiz() {
    let quiz = data[num_quiz]

    question_box.innerHTML = `
            <h2 class="question">
                <p>Q${num_quiz + 1}-${escapeHtml(quiz.question)}</p>
                <button id="btn_save">Save</button>
            </h2>
    `

    // Create shuffled answer choices
    shuffle(quiz.choices).forEach((choice, index) => {
        const div = document.createElement("div");
        div.className = "quiz_option";
        div.id = `opt${index}`
        div.textContent = choice;
        div.addEventListener("click", () => checkAnswer(div.id, quiz.correctAnswer))
        question_box.appendChild(div);
    });

    // Create before/next navigation buttons
    const btn_box = document.createElement("div");
    btn_box.className = "nav_buttons"
    const btn_before = document.createElement("button")
    btn_before.id = "btn_before"
    btn_before.textContent = "before"
    const btn_next = document.createElement("button")
    btn_next.id = "btn_next"
    btn_next.textContent = "next"
    btn_next.addEventListener("click",() => navigateQuiz("btn_next"))
    btn_before.addEventListener("click",() => navigateQuiz("btn_before"))
    btn_box.append(btn_before, btn_next)
    question_box.append(btn_box)
}

// Generate quiz on button click
btnGenerate.onclick = async () => {
    question_box.textContent = "Generating..."
    question_box.style.textAlign = "center"
    question_box.style.fontSize = "50px"
    data = await GenerateQuiz()

    // Stop if generation failed
    if (!data) {
        question_box.style = ""
        question_box.textContent = ""
        return
    }

    question_box.style = ""
    num_quiz = 0
    localStorage.setItem("quizState", num_quiz)
    displayQuiz()
}

// Navigate between questions
function navigateQuiz(id) {
    if (id === "btn_next" && num_quiz < data.length - 1) {
        num_quiz++
    } else if (id === "btn_before" && num_quiz > 0) {
        num_quiz--
    } else {
        return
    }

    localStorage.setItem("quizState", num_quiz)
    displayQuiz()
}

// Check user answer and provide feedback
function checkAnswer(id, correctAnswer) {
    if (completedQuiz) {
        alert("Quiz is completed")
        return
    }

    const usrChoice = document.getElementById(id)

    if (correctAnswer === usrChoice.textContent) {
        usrChoice.style.background = "green"
        if (num_quiz === data.length - 1) {
            completedQuiz = true
        } else {
            // Auto-advance to next question after 1 second
            setTimeout(() => {
                num_quiz++
                localStorage.setItem("quizState", num_quiz)
                displayQuiz()
            }, 1000)
        }
    } else {
        usrChoice.style.background = "red"
    }

    usrChoice.style.color = "#000"
    usrChoice.style.border = "none"
}

// Save current question to localStorage
function saveQuestion() {
    let question = question_box.querySelector("h2 p").textContent
    if (!questions.includes(question)) {
        questions.push(question)
        localStorage.setItem("savedQuestions", JSON.stringify(questions))
        renderSavedQuestions()
        alert("Question saved")
    } else {
        alert("Question already saved")
    }
}

// Show saved questions box
btnShowSaved.onclick = () => {
    savedQuestionsBox.style.animation = "show_box 0.5s ease forwards"
}

// Event delegation: save button click
question_box.addEventListener("click", (e) => {
    if (e.target.id === "btn_save") saveQuestion()
})

// Event delegation: close and delete buttons in saved questions box
savedQuestionsBox.addEventListener("click", (e) => {
    if (e.target.id === "btn_close") closeSavedBox()
    if (e.target.id === "btn_delete") {
        const index = Number(e.target.closest("[id^='ques_save']").id.replace("ques_save", ""))
        deleteSavedQuestion(index)
    }
})

// Delete a saved question by index
function deleteSavedQuestion(idBtn) {
    questions.splice(idBtn, 1)
    localStorage.setItem("savedQuestions", JSON.stringify(questions))
    renderSavedQuestions()
}

// Render all saved questions into the saved questions box
function renderSavedQuestions() {
    savedQuestionsBox.innerHTML = `<input type="button" id="btn_close" value="✖">`
    questions.forEach((ques, index) => {
        savedQuestionsBox.innerHTML += `
            <div id="ques_save${index}">
                <p class="question">${escapeHtml(ques)}</p>
                <button id="btn_delete">delete</button>
            </div>
        `
    })
}

renderSavedQuestions()

// Hide saved questions box with scale animation
function closeSavedBox() {
    savedQuestionsBox.style.animation = ""
    savedQuestionsBox.style.transform = "translate(-50%,-50%) scale(0)"
}
