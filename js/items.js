// === items.js: 아이템 시스템 (생성, 업데이트, 그리기, 파워업) ===

function spawnItem(x, y) {
    const types = ["PADDLE", "MULTIBALL"];
    const type = types[Math.floor(Math.random() * types.length)];
    items.push({ x: x, y: y, type: type, radius: 10 });
}

function updateItems() {
    for (let i = items.length - 1; i >= 0; i--) {
        let item = items[i];
        item.y += 2;

        if (item.y + item.radius > paddleY && item.y < paddleY + paddleHeight &&
            item.x > paddleX && item.x < paddleX + currentPaddleWidth) {
            activatePowerUp(item.type);
            items.splice(i, 1);
        } else if (item.y > canvas.height) {
            items.splice(i, 1);
        }
    }
}

function drawItems() {
    items.forEach(item => {
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
        ctx.fillStyle = item.type === "PADDLE" ? "#2ecc71" : "#f1c40f";
        ctx.fill();
        ctx.closePath();

        ctx.font = "bold 12px Segoe UI";
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.fillText(item.type === "PADDLE" ? "L" : "M", item.x, item.y + 4);
    });

    // 보스 말풍선 그리기
    bossSpeechBubbles.forEach(b => {
        ctx.save();
        const alpha = b.timer / 60;
        ctx.globalAlpha = alpha;

        ctx.font = "bold 20px sans-serif";
        const padding = 15;
        const textWidth = ctx.measureText(b.text).width;
        const width = textWidth + padding * 2;
        const height = 40;

        ctx.beginPath();
        ctx.roundRect(b.x, b.y, width, height, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "black";
        ctx.textAlign = "left";
        ctx.fillText(b.text, b.x + padding, b.y + 28);

        ctx.restore();
    });
}

function activatePowerUp(type) {
    if (type === "PADDLE") {
        currentPaddleWidth = paddleWidthBase * 2;
        paddleColor = "#2ecc71";

        if (paddleTimer) clearTimeout(paddleTimer);
        paddleTimer = setTimeout(() => {
            currentPaddleWidth = paddleWidthBase;
            paddleColor = "#e94560";
        }, 5000);
    } else if (type === "MULTIBALL") {
        while (balls.length < 3) {
            let baseBall = balls[Math.floor(Math.random() * balls.length)] || balls[0];
            if (!baseBall) break;
            balls.push({
                x: baseBall.x,
                y: baseBall.y,
                dx: -baseBall.dx * (0.5 + Math.random()),
                dy: baseBall.dy
            });
        }
    }
}
