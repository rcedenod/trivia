import LoadingScreen from './LoadingScreen.js';

window.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('container');

    const loadingScreenComponent = new LoadingScreen();
    document.body.appendChild(loadingScreenComponent.render());

    const gameConfigScreen = document.getElementById('gameconfig-screen');
    const gameScreen = document.getElementById('game-screen');
    const resultScreen = document.getElementById('result-screen');

    const configForm = document.getElementById('gameconfig-form');
    const playerNameInput = document.getElementById('player-name');
    const questionCountInput = document.getElementById('question-count');
    const difficultySelect = document.getElementById('difficulty');
    const categorySelect = document.getElementById('category');

    const progressDiv = document.getElementById('progress');
    const questionTextDiv = document.getElementById('question-text');
    const answersDiv = document.getElementById('answers');
    const timerBar = document.getElementById('timer-bar');
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
        if (element === gameConfigScreen  ) {
            element.style.display = 'block';
            appContainer.style.marginRight = '150px';
            document.body.style.justifyContent = 'right';

        } else if (element === resultScreen) {
            element.style.display = 'flex';
            appContainer.style.marginRight = '150px';
            document.body.style.justifyContent = 'right';

        } else if ( element === appContainer) {
            element.style.display = 'block';

        } else if ( element === gameScreen) {
            element.style.display = 'flex';
            document.body.style.backgroundImage = 'url(images/aydios.avif)';
            document.body.style.backgroundRepeat = 'no-repeat';
        }
        else {
            element.style.display = 'flex';
        }
    }

    function hideElement(element) {
        if (element) {
            element.style.display = 'none';
        }

        if (element === gameConfigScreen || element === resultScreen) {
            element.style.display = 'none';
            appContainer.style.marginRight = '0px';
            document.body.style.justifyContent = 'center';

        } else if (element === gameScreen) {
            element.style.display = 'none';
            document.body.style.backgroundImage = 'url(images/login_background_web.webp)'
        }
    }

    function showLoading() { 
        loadingScreenComponent.show(); 
        hideElement(appContainer);
    }

    function hideLoading() { 
        loadingScreenComponent.hide(); 
        showElement(appContainer);
    }

    async function fetchCategories() {
        try {
            showLoading();
            const res = await fetch('https://opentdb.com/api_category.php');
            const data = await res.json();
            categories = data.trivia_categories;
            hideLoading();
            createCategories();
            showElement(gameConfigScreen);      
            
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
            alert('The username must be between 2 and 20 characters');
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
        showLoading();

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
                setTimeout(() => {
                    hideLoading();
                    showElement(gameConfigScreen);
                }, 1000)
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

            setTimeout(() => {
                hideLoading();
                showElement(gameScreen);
                showQuestion();
            }, 1000)
            
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
});
