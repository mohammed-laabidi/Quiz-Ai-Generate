# QuizAi 🧠

QuizAi is a dynamic quiz generation platform that leverages the Gemini AI API to create customized multiple-choice questions on any subject in real-time.

## 🚀 Features

- **AI-Powered Generation**: Instantly generates 5 multiple-choice questions based on any subject provided by the user.
- **Real-time Scoring**: Tracks and displays the user's score as they progress through the quiz.
- **State Persistence**: Uses `localStorage` to save quiz progress, answer history, and generated questions, allowing users to resume where they left off.
- **Save for Later**: Users can save specific questions they find interesting or challenging to a dedicated "Saved Questions" list.
- **Dynamic UI**: Responsive interface with animations for a smooth user experience.

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: PHP
- **AI Engine**: Google Gemini API (`gemini-3.5-flash-lite`)
- **Storage**: Browser `localStorage`

## 📦 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd "QuizAi - Copie"
   ```

2. **Configure Environment**:
   The project requires an API key from Google AI Studio. Set the environment variable `API_KEY` on your server:
   - **XAMPP/Apache**: Add it to your virtual host configuration or set it via the OS environment variables.
   - **Example (.env or server config)**: `API_KEY=your_gemini_api_key_here`

3. **Run the Project**:
   - Place the folder in your local server directory (e.g., `C:\xampp\htdocs\`).
   - Start Apache via the XAMPP Control Panel.
   - Navigate to `http://localhost/QuizAi - Copie/` in your browser.

## ⚙️ How it Works

1. **Request**: The user enters a subject in the frontend (`script.js`).
2. **API Call**: The frontend sends a request to `api.php`.
3. **AI Processing**: `api.php` constructs a prompt and calls the Gemini API, requesting a strictly formatted JSON response.
4. **Rendering**: The JSON response is parsed by `script.js` and rendered as an interactive quiz.

## 📄 License

This project is open-source. Feel free to contribute!
