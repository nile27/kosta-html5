// === boss.js: 보스 로직, 공격 패턴, 그리기 ===

function showBossSpeech(text) {
    if (bossSpeechBubbles.length > 2) bossSpeechBubbles.shift();

    ctx.font = "bold 20px sans-serif";
    const textWidth = ctx.measureText(text).width;
    const padding = 15;
    const bubbleWidth = textWidth + padding * 2;

    let bubbleX;
    if (boss.x + boss.width / 2 > canvas.width / 2) {
        bubbleX = boss.x - bubbleWidth - 10;
    } else {
        bubbleX = boss.x + boss.width + 10;
    }

    bossSpeechBubbles.push({
        text: text,
        x: bubbleX,
        y: boss.y + 30,
        timer: 100
    });
}

function updateBoss() {
    if (!boss.active) return;

    // 단계별 이동 로직
    if (boss.phase === 3 || boss.phase === 4) {
        boss.x += boss.speed * boss.direction;
        if (boss.x <= 0 || boss.x + boss.width >= canvas.width) {
            boss.direction *= -1;
        }
    } else {
        boss.x = (canvas.width - boss.width) / 2;
    }

    boss.patternTimer++;

    // 체력에 따른 단계 전환
    let healthRatio = boss.health / boss.maxHealth;
    if (healthRatio > 0.75) boss.phase = 1;
    else if (healthRatio > 0.5) boss.phase = 2;
    else if (healthRatio > 0.25) boss.phase = 3;
    else boss.phase = 4;

    // 패턴 변경 로직
    if (boss.patternTimer > 180) {
        boss.patternTimer = 0;
        const patterns = ['MISSILE', 'AREA', 'THROW', 'MACHINEGUN'];

        let nextPattern;
        do {
            nextPattern = patterns[Math.floor(Math.random() * patterns.length)];
        } while (nextPattern === 'THROW' && boss.currentPattern === 'THROW');

        boss.currentPattern = nextPattern;

        if (boss.currentPattern === 'MISSILE') {
            spawnMissile();
            showBossSpeech("대포동 미사일!!");
        }
        if (boss.currentPattern === 'AREA') {
            spawnAreaAttack();
            showBossSpeech("핵 맛 좀 보라우!");
        }
        if (boss.currentPattern === 'THROW') {
            spawnBossBall();
            showBossSpeech("인민의 짱돌!");
        }
        if (boss.currentPattern === 'MACHINEGUN') {
            boss.machineGunShots = 6;
            showBossSpeech("조선 자동총");
        }
    }

    // 머신건 연사 로직
    if (boss.machineGunShots > 0 && boss.patternTimer % 20 === 0) {
        spawnMachineGunBullet();
        boss.machineGunShots--;
    }

    if (boss.hitFlash > 0) boss.hitFlash--;

    updateBossAttacks();

    // 말풍선 업데이트
    for (let i = bossSpeechBubbles.length - 1; i >= 0; i--) {
        bossSpeechBubbles[i].timer--;
        bossSpeechBubbles[i].y -= 0.5;
        if (bossSpeechBubbles[i].timer <= 0) bossSpeechBubbles.splice(i, 1);
    }
}

function drawBoss() {
    let healthPercent = boss.health / boss.maxHealth;
    let currentImage = (boss.hitFlash > 0 || healthPercent <= 0.3) ? bossHitImage : bossImage;

    ctx.save();
    if (boss.hitFlash > 0) {
        ctx.drawImage(currentImage, boss.x, boss.y, boss.width, boss.height);
        ctx.globalCompositeOperation = "source-atop";
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
    } else {
        ctx.drawImage(currentImage, boss.x, boss.y, boss.width, boss.height);
    }
    ctx.restore();

    // 보스 체력 바
    ctx.fillStyle = "#333";
    ctx.fillRect(boss.x, boss.y - 15, boss.width, 8);
    ctx.fillStyle = healthPercent > 0.3 ? "#00d2ff" : "#ff2e63";
    ctx.fillRect(boss.x, boss.y - 15, boss.width * healthPercent, 8);

    drawBossAttacks();

    // 공격 타이머 표시
    let timeLeft = Math.max(0, (180 - boss.patternTimer) / 60);
    ctx.save();
    ctx.font = "bold 18px sans-serif";
    ctx.fillStyle = "white";
    ctx.textAlign = "right";
    ctx.shadowBlur = 5;
    ctx.shadowColor = "black";
    ctx.fillText(`다음 공격: ${timeLeft.toFixed(1)}s`, canvas.width - 20, 30);

    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.fillRect(canvas.width - 120, 40, 100, 5);
    ctx.fillStyle = (timeLeft < 1) ? "#ff2e63" : "#00d2ff";
    ctx.fillRect(canvas.width - 120, 40, 100 * (timeLeft / 3), 5);
    ctx.restore();
}

// === 보스 공격 생성 함수 ===

function spawnMissile() {
    const targetX = paddleX + currentPaddleWidth / 2;
    const count = 3;
    for (let i = 0; i < count; i++) {
        let startX = boss.x + (boss.width / count) * i + (boss.width / (count * 2));
        let startY = boss.y + boss.height;
        let dx = (targetX - startX) / 100;

        bossMissiles.push({
            x: startX,
            y: startY,
            speedY: 3 + Math.random() * 2,
            speedX: dx + (Math.random() - 0.5) * 1,
            radius: 5
        });
    }
}

function spawnAreaAttack() {
    const safeZoneWidth = 150;
    const safeX = Math.random() * (canvas.width - safeZoneWidth);
    const safeInfo = { x: safeX, w: safeZoneWidth };

    bossAreaAttacks.push({ x: 0, y: paddleY - 40, w: safeX, h: 80, timer: 150, safeInfo: safeInfo });
    bossAreaAttacks.push({ x: safeX + safeZoneWidth, y: paddleY - 40, w: canvas.width - (safeX + safeZoneWidth), h: 80, timer: 150 });
}

function spawnBossBall() {
    const targetX = paddleX + currentPaddleWidth / 2;
    const startX = boss.x + boss.width / 2;
    const startY = boss.y + boss.height;
    const dy = 4;
    const framesToReach = (paddleY - startY) / dy;
    const dx = (targetX - startX) / framesToReach;

    bossBalls.push({
        x: startX,
        y: startY,
        dx: dx,
        dy: dy,
        radius: 10,
        reflected: false
    });
}

function spawnMachineGunBullet() {
    const targetX = paddleX + currentPaddleWidth / 2;
    const startX = boss.x + boss.width / 2;
    const startY = boss.y + boss.height;
    const angle = Math.atan2(paddleY - startY, targetX - startX);
    const speed = 2.5;

    bossBullets.push({
        x: startX,
        y: startY,
        dx: Math.cos(angle) * speed + (Math.random() - 0.5) * 5,
        dy: Math.sin(angle) * speed,
        radius: 3
    });
}

// === 보스 공격 업데이트 ===

function updateBossAttacks() {
    // 미사일 업데이트
    for (let i = bossMissiles.length - 1; i >= 0; i--) {
        let m = bossMissiles[i];
        m.x += m.speedX;
        m.y += m.speedY;

        if (m.y + m.radius > paddleY + 5 && m.y < paddleY + paddleHeight &&
            m.x > paddleX && m.x < paddleX + currentPaddleWidth) {
            loseLife();
            bossMissiles.splice(i, 1);
            continue;
        }

        if (m.y > canvas.height) bossMissiles.splice(i, 1);
    }

    bossSweepingLasers = [];

    // 구역 공격 업데이트
    for (let i = bossAreaAttacks.length - 1; i >= 0; i--) {
        bossAreaAttacks[i].timer--;
        if (bossAreaAttacks[i].timer < 0) bossAreaAttacks.splice(i, 1);
        else if (bossAreaAttacks[i].timer < 20) {
            checkAreaCollision(bossAreaAttacks[i]);
        }
    }

    // 보스 공 업데이트
    for (let i = bossBalls.length - 1; i >= 0; i--) {
        let b = bossBalls[i];
        b.x += b.dx;
        b.y += b.dy;

        if (b.reflected &&
            b.x + b.radius > boss.x && b.x - b.radius < boss.x + boss.width &&
            b.y + b.radius > boss.y && b.y - b.radius < boss.y + boss.height) {
            if (checkBossHit(b)) {
                bossBalls.splice(i, 1);
                continue;
            }
        }

        if (b.x + b.radius > canvas.width || b.x - b.radius < 0) b.dx = -b.dx;
        if (b.y - b.radius < 0) {
            b.dy = Math.abs(b.dy);
        }

        if (b.y + b.radius > paddleY && b.y < paddleY + paddleHeight &&
            b.x > paddleX && b.x < paddleX + currentPaddleWidth) {
            b.dy = -Math.abs(b.dy);
            b.reflected = true;
        }

        if (b.y > canvas.height) bossBalls.splice(i, 1);
    }

    // 머신건 탄환 업데이트
    for (let i = bossBullets.length - 1; i >= 0; i--) {
        let bull = bossBullets[i];
        bull.x += bull.dx;
        bull.y += bull.dy;

        if (bull.y + bull.radius > paddleY && bull.y < paddleY + paddleHeight &&
            bull.x > paddleX && bull.x < paddleX + currentPaddleWidth) {
            loseLife();
            bossBullets.splice(i, 1);
            continue;
        }

        if (bull.y > canvas.height || bull.x < 0 || bull.x > canvas.width) {
            bossBullets.splice(i, 1);
        }
    }
}

// === 보스 충돌 판정 ===

function checkLaserCollision(laser) {
    if (paddleX < laser.x + laser.w && paddleX + currentPaddleWidth > laser.x &&
        paddleY + 5 < laser.y + laser.h && paddleY > laser.y) {
        loseLife();
    }
}

function checkAreaCollision(area) {
    if (paddleX < area.x + area.w && paddleX + currentPaddleWidth > area.x &&
        paddleY < area.y + area.h && paddleY + paddleHeight > area.y) {
        loseLife();
    }
}

function checkBossHit(ball) {
    if (ball.x > boss.x && ball.x < boss.x + boss.width) {
        boss.health -= 5;
        boss.hitFlash = 15;
        if (boss.health <= 0) {
            showBossOutro("images/win_boss.png", "STAGE CLEAR!", "북한 보스를 물리쳤습니다! 위대한 승리입니다!");
        }
        showBossSpeech("간나!");
        return true;
    }
    return false;
}

// === 보스 공격 그리기 ===

function drawBossAttacks() {
    // 미사일 그리기
    bossMissiles.forEach(m => {
        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-m.radius, -m.radius * 2);
        ctx.lineTo(m.radius, -m.radius * 2);
        ctx.closePath();
        ctx.fillStyle = "#ff00dd";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#ff00dd";
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-m.radius / 2, -m.radius * 2);
        ctx.lineTo(0, -m.radius * 3 - (Math.random() * 5));
        ctx.lineTo(m.radius / 2, -m.radius * 2);
        ctx.fillStyle = "#ffaa00";
        ctx.fill();
        ctx.restore();
    });

    // 구역 공격 그리기
    bossAreaAttacks.forEach(a => {
        ctx.save();
        const areaColor = "255, 0, 0";

        if (a.timer > 20) {
            const areaColor = "255, 0, 0";
            ctx.fillStyle = `rgba(${areaColor}, ${0.1 + Math.abs(Math.sin(a.timer / 10)) * 0.2})`;
            ctx.fillRect(a.x, a.y, a.w, a.h);
            ctx.strokeStyle = `rgba(${areaColor}, 0.5)`;
            ctx.lineWidth = 2;
            ctx.strokeRect(a.x, a.y, a.w, a.h);

            if (a.safeInfo) {
                ctx.save();
                ctx.filter = 'grayscale(1) brightness(1.8)';
                ctx.globalAlpha = 0.5;
                ctx.drawImage(bunkerImg, a.safeInfo.x, a.y, a.safeInfo.w, a.h);
                ctx.restore();
            }

            if (a.timer % 40 < 20 && a.w > 100) {
                ctx.fillStyle = "white";
                ctx.font = "bold 16px sans-serif";
                ctx.textAlign = "center";
                ctx.fillText("! CAUTION !", a.x + a.w / 2, a.y + a.h / 2 + 5);
            }
        } else {
            const beamGrad = ctx.createLinearGradient(0, a.y, 0, a.y + a.h);
            beamGrad.addColorStop(0, `rgba(${areaColor}, 0.8)`);
            beamGrad.addColorStop(1, "rgba(255, 255, 255, 0.2)");

            ctx.fillStyle = beamGrad;
            ctx.fillRect(a.x, a.y, a.w, a.h);

            ctx.beginPath();
            ctx.strokeStyle = "white";
            ctx.lineWidth = 3;
            let sw = (20 - a.timer) * 5;
            ctx.arc(a.x + a.w / 2, a.y + a.h - 5, sw % 50, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    });

    // 미사일 이미지 그리기
    bossMissiles.forEach(m => {
        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.rotate(Math.PI);
        ctx.drawImage(missileImg, -5, -15, 10, 30);
        ctx.restore();

        ctx.beginPath();
        ctx.arc(m.x, m.y - 15, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 150, 0, 0.3)";
        ctx.fill();
    });

    // 보스 공 그리기
    bossBalls.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = b.reflected ? "#00ff00" : "#ff0000";
        ctx.fill();
        ctx.closePath();
    });

    // 머신건 탄환 그리기
    bossBullets.forEach(bull => {
        ctx.beginPath();
        ctx.arc(bull.x, bull.y, bull.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#ffaa00";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#ffaa00";
        ctx.fill();
        ctx.closePath();
        ctx.shadowBlur = 0;
    });
}
