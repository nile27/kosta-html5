// === bricks.js: 벽돌 초기화, 그리기, 충돌 감지 ===

function initBricks() {
    bricks = [];
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            bricks[c][r] = { x: 0, y: 0, status: 1 };
        }
    }
}

function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
                const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;
                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                ctx.fillStyle = "rgba(255, 119, 0, 0.4)";
                ctx.strokeStyle = "#ff7700";
                ctx.lineWidth = 2;

                ctx.save();
                ctx.shadowBlur = 12;
                ctx.shadowColor = "#ff7700";
                ctx.stroke();
                ctx.fill();
                ctx.restore();

                ctx.closePath();
            }
        }
    }
}

function collisionDetection() {
    for (let i = 0; i < balls.length; i++) {
        let ball = balls[i];
        for (let c = 0; c < brickColumnCount; c++) {
            for (let r = 0; r < brickRowCount; r++) {
                let b = bricks[c][r];
                if (b.status === 1) {
                    if (ball.x + ballRadius + 2 > b.x &&
                        ball.x - ballRadius - 2 < b.x + brickWidth &&
                        ball.y + ballRadius + 2 > b.y &&
                        ball.y - ballRadius - 2 < b.y + brickHeight) {
                        ball.dy = -ball.dy;
                        b.status = 0;
                        score++;

                        if (Math.random() < 0.2) {
                            spawnItem(b.x + brickWidth / 2, b.y + brickHeight / 2);
                        }

                        if (score === brickRowCount * brickColumnCount) {
                            startBossLevel();
                        }
                    }
                }
            }
        }
    }
}
