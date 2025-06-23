const gameConfigScreen = document.getElementById('gameconfig-screen');
const gameScreen = document.getElementById('game-screen');

const configForm = document.getElementById('gameconfig-form');
const playerNameInput = document.getElementById('player-name');
const questionCountInput = document.getElementById('question-count');
const difficultySelect = document.getElementById('difficulty');
const categorySelect = document.getElementById('category');

const progressDiv = document.getElementById('progress');
const questionTextDiv = document.getElementById('question-text');
const answersDiv = document.getElementById('answers');
const timerBar = document.getElementById('timer-bar');
const timerText = document.getElementById('timer-text');
const scoreDisplay = document.getElementById('score-display');

let categories = [];
let config = {};
let questions = [];
let questionIndex = 0;
let score = 0;
let correctCount = 0;
let times = [];
let timerInterval = null;
const QUESTION_TIME = 20;
let questionStartTime = 0;

function showElement(element) {
    element.style.display = 'block';
}
function hideElement(element) {
    element.style.display = 'none';
}

async function fetchCategories() {
    try {
        const res = await fetch('https://opentdb.com/api_category.php');
        const data = await res.json();
        categories = data.trivia_categories;
        createCategories();
    } catch (error) {
        console.error('Error getting categories:', error);
    }
}

function createCategories() {
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        categorySelect.appendChild(option);
    });
}

configForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const playerName = playerNameInput.value.trim();
    const questionCount = parseInt(questionCountInput.value, 10);
    const difficulty = difficultySelect.value;
    const category = categorySelect.value;

    if (playerName.length < 2 || playerName.length > 20) {
        alert('The usernamen must be between 2 and 20 characters');
        return;
    }
    if (questionCount < 5 || questionCount > 20) {
        alert('The number of questions must be between 5 and 20');
        return;
    }

    config = { playerName, questionCount, difficulty, category };
    startGame();
});

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

async function startGame() {
    hideElement(gameConfigScreen);

    const url = new URL('https://opentdb.com/api.php');
    url.searchParams.set('amount', config.questionCount);
    url.searchParams.set('difficulty', config.difficulty);
    url.searchParams.set('type', 'multiple');

    if (config.category) {
        url.searchParams.set('category', config.category);
    }

    try {
        const res = await fetch(url.toString());

        const data = await res.json();
        if (data.response_code !== 0) {
            alert('Not enough questions found for this configuration. Please adjust your settings');
            showElement(gameConfigScreen);
            return;
        }
        questions = data.results.map(element => ({
            question: element.question,
            correct: element.correct_answer,
            answers: shuffleAnswers(element.correct_answer, element.incorrect_answers)
        }));

        questionIndex = 0;
        score = 0;
        correctCount = 0;
        times = [];
        showElement(gameScreen);
        showQuestion();
        
    } catch (error) {
        console.error('Connection error while obtaining questions:', error);
        alert('Connection error while obtaining questions. Please try again.');
        showElement(gameConfigScreen);
    }
}

function shuffleAnswers(correct, incorrects) {
    const arr = [...incorrects.map(ans => ans), correct];
    shuffleArray(arr);
    return arr;
}

function showQuestion() {
    clearInterval(timerInterval);
    const qObj = questions[questionIndex];
    progressDiv.textContent = `Pregunta ${questionIndex + 1} de ${config.questionCount}`;
    questionTextDiv.textContent = qObj.question;
    answersDiv.innerHTML = '';
    qObj.answers.forEach(answer => {
        const btn = document.createElement('button');
        btn.classList.add('answer-btn');
        btn.textContent = answer;
        btn.addEventListener('click', () => selectAnswer(answer));
        answersDiv.appendChild(btn);
    });
    updateScoreDisplay();
    startTimer();
}

function startTimer() {
    let remaining = QUESTION_TIME;
    timerBar.textContent = `${remaining}s`;
    timerBar.style.width = '100%';
    timerBar.classList.remove('warning');
    questionStartTime = Date.now();

    timerInterval = setInterval(() => {
        remaining--;
        timerBar.textContent = `${remaining}s`;
        const pct = (remaining / QUESTION_TIME) * 100;
        timerBar.style.width = `${pct}%`;
        if (remaining <= 5) {
            timerBar.classList.add('warning');
        }
        if (remaining <= 0) {
            clearInterval(timerInterval);
            times.push(QUESTION_TIME);
            revealAnswer(null);
        }
    }, 1000);

}

function selectAnswer(selected) {
    clearInterval(timerInterval);
    const elapsed = Math.floor((Date.now() - questionStartTime) / 1000);
    times.push(elapsed);
    revealAnswer(selected);
}

function revealAnswer(selected) {
    const qObj = questions[questionIndex];
    const buttons = answersDiv.querySelectorAll('button');
    buttons.forEach(btn => btn.disabled = true);
    buttons.forEach(btn => {
        if (btn.textContent === qObj.correct) {
            btn.classList.add('correct');
        } else if (btn.textContent === selected) {
            btn.classList.add('incorrect');
        }
    });
    if (selected === qObj.correct) {
        score += 10;
        correctCount++;
    }
    updateScoreDisplay();
    setTimeout(() => {
        questionIndex++;
        if (questionIndex < config.questionCount) {
            showQuestion();
        }
    }, 2000);
}

function updateScoreDisplay() {
    scoreDisplay.textContent = `Score: ${score} | Correct: ${correctCount} | Incorrect: ${questionIndex - correctCount}`;
}

fetchCategories();