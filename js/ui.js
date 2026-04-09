// === ui.js: 모달, 인트로/아웃트로 ===

function showModal(title, message, isGameOver = true) {
    gameRunning = false;
    modalTitle.innerText = title;
    modalMessage.innerText = message;
    modalBtn.innerText = isGameOver ? "새 게임 시작" : "계속하기";
    modal.style.display = "flex";
    modalBtn.focus();

    modalBtn.onclick = () => {
        modal.style.display = "none";
        if (isGameOver) {
            document.location.reload();
        } else {
            gameRunning = true;
            draw();
        }
    };
}

function startBossLevel() {
    currentLevel = 2;
    baseSpeed = 3;
    boss.active = true;
    boss.health = boss.maxHealth;
    boss.phase = 1;
    boss.patternTimer = 0;

    balls = [];
    items = [];
    currentPaddleWidth = paddleWidthBase;
    paddleColor = "#e94560";
    if (paddleTimer) clearTimeout(paddleTimer);

    bossMissiles = [];
    bossSweepingLasers = [];
    bossAreaAttacks = [];
    bossBalls = [];
    bossBullets = [];
    bossSpeechBubbles = [];

    paddleX = (canvas.width - currentPaddleWidth) / 2;

    // 보스 등장 인트로 표시
    gameRunning = false;
    introImg.style.opacity = 0;
    introImg.src = 'images/intro.png';
    introImg.onload = () => { introImg.style.opacity = 1; };
    bossIntro.style.display = "flex";

    const onIntroKey = (e) => {
        hideBossIntro();
        window.removeEventListener("keydown", onIntroKey);
    };
    window.addEventListener("keydown", onIntroKey);
}

function hideBossIntro() {
    bossIntro.style.display = "none";
    gameRunning = true;
    draw();
}

function showBossOutro(imagePath, title, message) {
    gameRunning = false;
    introImg.style.opacity = 0;
    introImg.src = imagePath;
    introImg.onload = () => { introImg.style.opacity = 1; };
    bossIntro.style.display = "flex";

    setTimeout(() => {
        const onOutroKey = () => {
            bossIntro.style.display = "none";
            window.removeEventListener("keydown", onOutroKey);
            document.location.reload();
        };
        window.addEventListener("keydown", onOutroKey);
    }, 500);
}
