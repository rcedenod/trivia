const gameConfigScreen = document.getElementById('gameconfig-screen');
const gameScreen = document.getElementById('game-screen');
const resultScreen = document.getElementById('result-screen');
const loadingScreen = document.getElementById('loading-screen');
const loadingMessage = document.getElementById('loading-message');

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

const resultPlayer = document.getElementById('result-player');
const resultScore = document.getElementById('result-score');
const resultCorrect = document.getElementById('result-correct');
const resultPercentage = document.getElementById('result-percentage');
const resultAverageTime = document.getElementById('result-average-time');
const restartSameBtn = document.getElementById('restart-same');
const changeConfigBtn = document.getElementById('change-config');
const finishBtn = document.getElementById('finish');

let categories = [];
let times = [];
let questions = [];

let questionIndex = 0;
let score = 0;
let correctCount = 0;
let questionStartTime = 0;
let timerInterval = null;

let config = {};

const questionTime = 20;


function showElement(element) {
    if (element === gameConfigScreen) {
        element.style.display = 'block';
    } else {
        element.style.display = 'flex';
    }
}

function hideElement(element) {
    element.style.display = 'none';
}

async function fetchCategories() {
    try {
        const res = await fetch('https://opentdb.com/api_category.php');
        const data = await res.json();

        categories = data.trivia_categories;
        hideElement(loadingScreen);
        showElement(gameConfigScreen);

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

async function startGame() {
    hideElement(gameConfigScreen);
    hideElement(resultScreen);
    showElement(loadingScreen);

    const url = new URL('https://opentdb.com/api.php');
    url.searchParams.set('amount', config.questionCount);
    url.searchParams.set('difficulty', config.difficulty);
    url.searchParams.set('type', 'multiple');
    url.searchParams.set('encode', 'url3986');

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
        hideElement(loadingScreen);
        showElement(gameScreen);
        showQuestion();
        
    } catch (error) {
        console.error('Connection error while obtaining questions:', error);
        alert('Connection error while obtaining questions. Please try again.');
        showElement(gameConfigScreen);
    }
}

function shuffleAnswers(correct, incorrects) {
    const array = [...incorrects.map(answer => answer), correct];
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function showQuestion() {
    clearInterval(timerInterval);
    const questionObject = questions[questionIndex];
    progressDiv.textContent = `Question ${questionIndex + 1} out of ${config.questionCount}`;
    questionTextDiv.textContent = questionObject.question;
    answersDiv.innerHTML = '';

    questionObject.answers.forEach(answer => {
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
    let remainingSeconds = questionTime;
    timerBar.textContent = `${remainingSeconds}s`;
    timerBar.style.width = '100%';
    timerBar.classList.remove('warning');
    questionStartTime = Date.now();

    timerInterval = setInterval(() => {
        remainingSeconds--;
        timerBar.textContent = `${remainingSeconds}s`;
        const widthPercentage = (remainingSeconds / questionTime) * 100;
        timerBar.style.width = `${widthPercentage}%`;
        if (remainingSeconds <= 5) {
            timerBar.classList.add('warning');
        }
        if (remainingSeconds <= 0) {
            clearInterval(timerInterval);
            times.push(questionTime);
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
    const questionObject = questions[questionIndex];
    const buttons = answersDiv.querySelectorAll('button');
    buttons.forEach(btn => btn.disabled = true);
    buttons.forEach(btn => {
        if (btn.textContent === questionObject.correct) {
            btn.classList.add('correct');
        } else if (btn.textContent === selected) {
            btn.classList.add('incorrect');
        }
    });
    if (selected === questionObject.correct) {
        score += 10;
        correctCount++;
    }
    updateScoreDisplay();
    setTimeout(() => {
        questionIndex++;
        if (questionIndex < config.questionCount) {
            showQuestion();
        } else {
            endGame();
        }
    }, 2000);
}

function updateScoreDisplay() {
    scoreDisplay.textContent = `Score: ${score} | Correct: ${correctCount} | Incorrect: ${questionIndex - correctCount}`;
}

function endGame() {
    hideElement(gameScreen);
    showElement(resultScreen);
    resultPlayer.textContent = `Player: ${config.playerName}`;
    resultScore.textContent = `Total score: ${score}`;
    resultCorrect.textContent = `Correct answers: ${correctCount} out of ${config.questionCount}`;
    const percentage = ((correctCount / config.questionCount) * 100).toFixed(2);
    resultPercentage.textContent = `Success rate: ${percentage}%`;
    const totalSeconds = times.reduce((a, b) => a + b, 0);
    const avg = (totalSeconds / config.questionCount).toFixed(2);
    resultAverageTime.textContent = `Average answer time: ${avg} seconds`;
}

restartSameBtn.addEventListener('click', () => {
    startGame();
});
changeConfigBtn.addEventListener('click', () => {
    hideElement(resultScreen);
    hideElement(gameScreen);
    showElement(gameConfigScreen);
});
finishBtn.addEventListener('click', () => {
    window.location.reload();
});

fetchCategories();