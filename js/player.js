// === player.js: 공, 패들 그리기 및 키보드 입력 처리 ===

// 키보드 이벤트 핸들러
function keyDownHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") {
        rightPressed = true;
    } else if (e.key === "Left" || e.key === "ArrowLeft") {
        leftPressed = true;
    }
}

function keyUpHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") {
        rightPressed = false;
    } else if (e.key === "Left" || e.key === "ArrowLeft") {
        leftPressed = false;
    }
}

function drawBall() {
    balls.forEach(ball => {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#ccff00"; 
        ctx.fill();
        ctx.restore();
        
        ctx.closePath();
    });
}

function drawPaddle() {
    if (playerInvincibleTimer > 0) {
        if (Math.floor(Date.now() / 100) % 2 === 0) return;
    }

    ctx.beginPath();
    ctx.rect(paddleX, paddleY, currentPaddleWidth, paddleHeight);
    ctx.fillStyle = paddleColor;
    ctx.fill();
    ctx.closePath();
}

function loseLife() {
    if (playerInvincibleTimer > 0) return;

    lives--;
    livesDisplay.innerText = lives;
    playerInvincibleTimer = 90;

    if (lives <= 0) {
        if (currentLevel === 2) {
            showBossOutro("images/loss_boss.png", "게임 오버", "보스에게 패배했습니다. 다시 도전해 보세요!");
        } else {
            showModal("게임 오버", "모든 목숨을 잃었습니다.", true);
        }
    } else {
        if (currentLevel !== 2) {
            showModal("아야!", "공격에 당했습니다!", false);
        }
    }
}

// 이벤트 리스너 등록
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
