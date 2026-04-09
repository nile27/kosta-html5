// === game.js: 메인 게임 루프, 시작, 리셋, 이벤트 바인딩 ===

// 이벤트 리스너 등록
startBtn.addEventListener("click", startGame);

// 스킵 버튼: 게임 중일 때 바로 보스전으로 전환
skipBtn.addEventListener("click", () => {
    if (gameRunning && currentLevel === 1) {
        startBossLevel();
    }
});

// 보스 피 1 버튼 (테스트용)
killBossBtn.addEventListener("click", () => {
    if (gameRunning && currentLevel === 2 && boss.active) {
        boss.health = 1;
        boss.hitFlash = 15;
    }
});

function startGame() {
    if (gameRunning) return;

    score = 0;
    lives = 3;
    currentLevel = 1;
    baseSpeed = 3;
    currentPaddleWidth = paddleWidthBase;
    paddleX = (canvas.width - currentPaddleWidth) / 2;

    boss.active = false;
    boss.health = boss.maxHealth;
    boss.x = (canvas.width - boss.width) / 2;

    balls = [{
        x: canvas.width / 2,
        y: canvas.height - 30,
        dx: baseSpeed,
        dy: -baseSpeed
    }];
    items = [];
    playerInvincibleTimer = 0;
    if (paddleTimer) clearTimeout(paddleTimer);

    livesDisplay.innerText = lives;
    initBricks();

    gameRunning = true;
    startBtn.style.display = "none";
    draw();
}

function resetGame() {
    gameRunning = false;
    startBtn.style.display = "inline-block";
    startBtn.innerText = "다시 시작";
}

function draw() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentLevel === 1) {
        ctx.drawImage(stage1BgImg, 0, 0, canvas.width, canvas.height);
        drawBricks();
    } else if (currentLevel === 2 && boss.active) {
        ctx.drawImage(bossBgImg, 0, 0, canvas.width, canvas.height);
        updateBoss();
        drawBoss();
    }

    drawBall();
    drawPaddle();
    drawItems();

    if (currentLevel === 1) {
        collisionDetection();
    }

    updateItems();

    // 공 이동 및 충돌 로직
    for (let i = balls.length - 1; i >= 0; i--) {
        let ball = balls[i];

        if (ball.x + ball.dx > canvas.width - ballRadius || ball.x + ball.dx < ballRadius) {
            ball.dx = -ball.dx;
        }
        if (ball.y + ball.dy < ballRadius) {
            ball.dy = -ball.dy;
        } else if (ball.y + ball.dy > paddleY) {
            if (ball.x > paddleX - 5 && ball.x < paddleX + currentPaddleWidth + 5) {
                ball.dy = -Math.abs(ball.dy);
                ball.y = paddleY - ballRadius;
                let hitPos = (ball.x - (paddleX + currentPaddleWidth / 2)) / (currentPaddleWidth / 2);
                ball.dx = hitPos * Math.abs(ball.dy) * 1.2;
            } else {
                balls.splice(i, 1);
            }
        } else {
            ball.x += ball.dx;
            ball.y += ball.dy;
        }
    }

    // 모든 공을 잃었을 때 처리 (일반 스테이지 전용)
    if (currentLevel === 1 && balls.length === 0) {
        lives--;
        livesDisplay.innerText = lives;
        if (!lives) {
            showModal("게임 오버", "모든 목숨을 잃었습니다.", true);
        } else {
            showModal("다시 도전해보세요.", `공을 놓쳤습니다! 남은 목숨: ${lives}개`, false);
            balls = [{
                x: canvas.width / 2,
                y: canvas.height - 30,
                dx: baseSpeed,
                dy: -baseSpeed
            }];
            paddleX = (canvas.width - currentPaddleWidth) / 2;
        }
    }

    if (playerInvincibleTimer > 0) playerInvincibleTimer--;

    if (rightPressed && paddleX < canvas.width - currentPaddleWidth) {
        paddleX += 7;
    } else if (leftPressed && paddleX > 0) {
        paddleX -= 7;
    }

    if (gameRunning) {
        requestAnimationFrame(draw);
    }
}

// 초기 벽돌 생성
initBricks();
