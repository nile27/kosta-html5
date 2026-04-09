const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const livesDisplay = document.getElementById("lives");
const startBtn = document.getElementById("startBtn");

// 모달 관련 DOM
const modal = document.getElementById("gameModal");
const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");
const modalBtn = document.getElementById("modalBtn");
const skipBtn = document.getElementById("skipBtn");
const killBossBtn = document.getElementById("killBossBtn");
const bossIntro = document.getElementById("bossIntro");
// 이미지 로드
const stage1BgImg = new Image();
stage1BgImg.src = 'images/1stage_night.PNG'; // 1스테이지 배경 이미지
const bossBgImg = new Image();
bossBgImg.src = 'images/boss_bg.png'; // 보스전 배경 이미지
const bossImage = new Image();
bossImage.src = 'images/boss_cut.svg'; // 잘린 버전의 보스 이미지로 변경
const bossHitImage = new Image();
bossHitImage.src = 'images/boss_3hit.svg'; // 체력이 낮을 때 보스 이미지
bossImage.onload = () => {
    // 보스의 히트박스 크기를 이미지에 더 가깝게 조정 (120x160)
    boss.width = 120;
    boss.height = 160;

    // 위치도 중앙으로 재조정
    boss.x = (canvas.width - boss.width) / 2;
    boss.maxHealth = 50; // 체력 등 초기값 재설정 (이미지 로드 후)
    boss.health = 50;
};
const missileImg = new Image();
missileImg.src = 'images/missale.svg';
const shieldImg = new Image();
shieldImg.src = 'images/shield.svg';
const bunkerImg = new Image();
bunkerImg.src = 'images/벙커.svg';


// 게임 상태 변수
let score = 0;
let lives = 3;
let gameRunning = false;
let currentLevel = 1; // 1: 벽돌, 2: 보스

// 공 (Ball) 속성
let ballRadius = 8;
let balls = []; // 여러 개의 공을 관리하는 배열
let baseSpeed = 3; // 기본 속도 공통 관리

// 패들 (Paddle) 속성
const paddleHeight = 10;
const paddleWidthBase = 105; // 30px 더 길게 확장 (75 -> 105)
let currentPaddleWidth = paddleWidthBase; // 현재 너비
const paddleY = canvas.height - 40; // 패들 Y 위치를 바닥에서 띄움 (요구사항)
let paddleX = (canvas.width - currentPaddleWidth) / 2;
let paddleColor = "#e94560"; // 기본 패들 색상

// 아이템 배열 및 타이머
let items = [];
let paddleTimer = null;

let boss = {
    x: 0,
    y: 50,
    width: 200,
    height: 40,
    health: 50, // 체력 상향 (공 던지기 패턴 위주이므로)
    maxHealth: 50,
    speed: 3,
    direction: 1,
    active: false,
    hitFlash: 0,
    phase: 1, // 1단계 ~ 4단계
    patternTimer: 0,
    currentPattern: 'IDLE', // IDLE, LASER, AREA, THROW, MACHINEGUN
    machineGunShots: 0 // 머신건 남은 발수
};

// 보스 공격 요소
let bossMissiles = []; // 보스가 쏘는 미사일 (기존 레이저 대체)
let bossSweepingLasers = []; // 좌우로 훑는 레이저 (요구사항)
let bossAreaAttacks = [];
let bossBalls = []; // 보스가 던지는 공격용 공 (반사해서 맞춰야 함)
let bossBullets = []; // 머신건 탄환 (Phase 3+ 추가)
let bossSpeechBubbles = []; // 보스 피격 시 나오는 말풍선 (요구사항)

// 플레이어 상태 추가
let playerInvincibleTimer = 0; // 무적 시간 타이머

// 키보드 제어 상태
let rightPressed = false;
let leftPressed = false;

// 벽돌 (Bricks) 설정
const brickRowCount = 4;
const brickColumnCount = 7;
const brickWidth = 75;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 30;

let bricks = [];

function initBricks() {
    bricks = [];
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            bricks[c][r] = { x: 0, y: 0, status: 1 };
        }
    }
}

// 이벤트 리스너 등록
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
startBtn.addEventListener("click", startGame);

// 스킵 버튼: 게임 중일 때 바로 보스전으로 전환
skipBtn.addEventListener("click", () => {
    if (gameRunning && currentLevel === 1) {
        startBossLevel();
    }
});

// 보스 피 1 버튼: 보스전일 때 보스 피를 1로 만듦 (테스트용)
killBossBtn.addEventListener("click", () => {
    if (gameRunning && currentLevel === 2 && boss.active) {
        boss.health = 1;
        boss.hitFlash = 15;
    }
});

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


function startGame() {
    if (gameRunning) return;

    // 초기화
    score = 0;
    lives = 3;
    currentLevel = 1;
    baseSpeed = 3; // 이전 속도로 복구
    currentPaddleWidth = paddleWidthBase;
    paddleX = (canvas.width - currentPaddleWidth) / 2;

    // 보스 초기화
    boss.active = false;
    boss.health = boss.maxHealth;
    boss.x = (canvas.width - boss.width) / 2;

    // 초기 공 하나 생성
    balls = [{
        x: canvas.width / 2,
        y: canvas.height - 30,
        dx: baseSpeed,
        dy: -baseSpeed
    }];
    items = [];
    playerInvincibleTimer = 0; // 무적 초기화
    if (paddleTimer) clearTimeout(paddleTimer);

    livesDisplay.innerText = lives;
    initBricks();

    gameRunning = true;
    startBtn.style.display = "none";
    draw();
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

                        // 20% 확률로 아이템 생성
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

function drawBall() {
    balls.forEach(ball => {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff"; // 흰색 공
        
        // 반짝이는 강렬한 연두색/노란색 네온 효과
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#ccff00"; 
        ctx.fill();
        ctx.restore();
        
        ctx.closePath();
    });
}

function drawPaddle() {
    // 무적 상태일 때 깜빡임 효과 (프레임 단위로 투명도 조절)
    if (playerInvincibleTimer > 0) {
        if (Math.floor(Date.now() / 100) % 2 === 0) return; // 0.1초 간격 점멸
    }

    ctx.beginPath();
    ctx.rect(paddleX, paddleY, currentPaddleWidth, paddleHeight);
    ctx.fillStyle = paddleColor;
    ctx.fill();
    ctx.closePath();
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
                // 너무 까맣지 않도록 내부를 반투명한 주황색(유리 느낌)으로 변경
                ctx.fillStyle = "rgba(255, 119, 0, 0.4)";
                ctx.strokeStyle = "#ff7700"; // 밝은 네온 주황/금색
                ctx.lineWidth = 2;

                // 네온 글로우 효과 추가
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

function resetGame() {
    gameRunning = false;
    startBtn.style.display = "inline-block";
    startBtn.innerText = "다시 시작";
}

function draw() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentLevel === 1) {
        // 1스테이지 배경 이미지 그리기
        ctx.drawImage(stage1BgImg, 0, 0, canvas.width, canvas.height);
        drawBricks();
    } else if (currentLevel === 2 && boss.active) {
        // 보스전 배경 이미지 그리기
        ctx.drawImage(bossBgImg, 0, 0, canvas.width, canvas.height);
        updateBoss();
        drawBoss();
        // bossCollisionDetection() 은 이제 사용하지 않음 (보스 공 반사로만 대미지)
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

        // 벽 충돌 감지 (좌우)
        if (ball.x + ball.dx > canvas.width - ballRadius || ball.x + ball.dx < ballRadius) {
            ball.dx = -ball.dx;
        }
        // 벽 충돌 감지 (상단)
        if (ball.y + ball.dy < ballRadius) {
            ball.dy = -ball.dy;
        } else if (ball.y + ball.dy > paddleY) {
            // 패들 충돌 감지 (상향된 패들 위치 기준)
            if (ball.x > paddleX - 5 && ball.x < paddleX + currentPaddleWidth + 5) {
                ball.dy = -Math.abs(ball.dy);
                ball.y = paddleY - ballRadius; // 패들 위로 위치 보정
                // 패들 중앙에서 멀어질수록 좌우 속도 변화 (더 다이나믹한 핑퐁)
                let hitPos = (ball.x - (paddleX + currentPaddleWidth / 2)) / (currentPaddleWidth / 2);
                ball.dx = hitPos * Math.abs(ball.dy) * 1.2;
            } else {
                // 이 공은 바닥으로 떨어짐
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
            // 공 초기화
            balls = [{
                x: canvas.width / 2,
                y: canvas.height - 30,
                dx: baseSpeed,
                dy: -baseSpeed
            }];
            paddleX = (canvas.width - currentPaddleWidth) / 2;
        }
    }

    // 무적 타이머 감소
    if (playerInvincibleTimer > 0) playerInvincibleTimer--;

    // 패들 이동 제어
    if (rightPressed && paddleX < canvas.width - currentPaddleWidth) {
        paddleX += 7;
    } else if (leftPressed && paddleX > 0) {
        paddleX -= 7;
    }

    if (gameRunning) {
        requestAnimationFrame(draw);
    }
}

// === 보스전 및 추가 시스템 함수 ===

function startBossLevel() {
    currentLevel = 2;
    baseSpeed = 3;
    boss.active = true;
    boss.health = boss.maxHealth;
    boss.phase = 1;
    boss.patternTimer = 0;

    // 스테이지 전환 시 모든 오브젝트 및 효과 초기화 (요구사항)
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
    introImg.style.opacity = 0; // 이미지 로드 전까지 숨김
    introImg.src = 'images/intro.png';
    introImg.onload = () => { introImg.style.opacity = 1; }; // 로드 완료 시 표시
    bossIntro.style.display = "flex";

    // 아무 키나 누르면 인트로 숨기고 게임 시작
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
    introImg.style.opacity = 0; // 이미지 로드 전까지 숨김
    introImg.src = imagePath;
    introImg.onload = () => { introImg.style.opacity = 1; }; // 로드 완료 시 표시
    bossIntro.style.display = "flex";

    // 약간의 지연 후 키 입력을 받아서 실수로 넘기는 것 방지
    setTimeout(() => {
        const onOutroKey = () => {
            bossIntro.style.display = "none";
            window.removeEventListener("keydown", onOutroKey);
            // 모달 없이 바로 재시작
            document.location.reload();
        };
        window.addEventListener("keydown", onOutroKey);
    }, 500); // 0.5초 지연
}

function showBossSpeech(text) {
    if (bossSpeechBubbles.length > 2) bossSpeechBubbles.shift();

    // 텍스트 너비 미리 측정하여 위치 계산 (요구사항: 화면 우측 시 좌측 배치)
    ctx.font = "bold 20px sans-serif";
    const textWidth = ctx.measureText(text).width;
    const padding = 15;
    const bubbleWidth = textWidth + padding * 2;

    let bubbleX;
    if (boss.x + boss.width / 2 > canvas.width / 2) {
        // 보스가 우측에 있으면 보스 왼쪽에 배치
        bubbleX = boss.x - bubbleWidth - 10;
    } else {
        // 보스가 좌측에 있으면 보스 오른쪽에 배치
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
        // 1, 2단계는 중앙 고정
        boss.x = (canvas.width - boss.width) / 2;
    }

    // 패턴 타이머 업데이트
    boss.patternTimer++;

    // 체력에 따른 단계 전환 (간단 예시: 100~75: 1단계, 75~50: 2단계, 50~25: 3단계, 25~0: 4단계)
    let healthRatio = boss.health / boss.maxHealth;
    if (healthRatio > 0.75) boss.phase = 1;
    else if (healthRatio > 0.5) boss.phase = 2;
    else if (healthRatio > 0.25) boss.phase = 3;
    else boss.phase = 4;

    // 패턴 변경 로직 (현재는 간단히 일정 시간마다 변경)
    if (boss.patternTimer > 180) { // 3초마다 패턴 변경 시도
        boss.patternTimer = 0;
        const patterns = ['MISSILE', 'AREA', 'THROW', 'MACHINEGUN']; // 머신건 패턴 상시 포함

        let nextPattern;
        // 짱돌 던지기('THROW') 패턴이 연속으로 나오지 않도록 함
        do {
            nextPattern = patterns[Math.floor(Math.random() * patterns.length)];
        } while (nextPattern === 'THROW' && boss.currentPattern === 'THROW');

        boss.currentPattern = nextPattern;

        // 패턴 시작 시 전용 대사 출력
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
            boss.machineGunShots = 6; // 6발 연사 설정 (대폭 하향)
            showBossSpeech("조선 자동총");
        }
    }

    // 머신건 연사 로직 (패턴 지속 시간 동안 탄환 생성)
    if (boss.machineGunShots > 0 && boss.patternTimer % 20 === 0) { // 20프레임마다 발사 (간격 대폭 증가)
        spawnMachineGunBullet();
        boss.machineGunShots--;
    }

    if (boss.hitFlash > 0) boss.hitFlash--;

    // 공격 레이저/공 업데이트 (추후 구현)
    updateBossAttacks();
    // 말풍선 업데이트
    for (let i = bossSpeechBubbles.length - 1; i >= 0; i--) {
        bossSpeechBubbles[i].timer--;
        bossSpeechBubbles[i].y -= 0.5; // 위로 서서히 떠오름
        if (bossSpeechBubbles[i].timer <= 0) bossSpeechBubbles.splice(i, 1);
    }
}

function drawBoss() {
    let healthPercent = boss.health / boss.maxHealth;
    // [보스 5단계 및 피격 반응] 빨간 피가 되거나 피격 중일 때 이미지 변경
    let currentImage = (boss.hitFlash > 0 || healthPercent <= 0.3) ? bossHitImage : bossImage;

    // 보스 이미지 렌더링
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

    // 보스 체력 바 배경
    ctx.fillStyle = "#333";
    ctx.fillRect(boss.x, boss.y - 15, boss.width, 8);

    // 보스 현재 체력 바 (빨간 피 강조)
    ctx.fillStyle = healthPercent > 0.3 ? "#00d2ff" : "#ff2e63";
    ctx.fillRect(boss.x, boss.y - 15, boss.width * healthPercent, 8);

    // 공격 이펙트 그리기 (추후 구현)
    drawBossAttacks();

    // [보스 공격 타이머 표시]
    let timeLeft = Math.max(0, (180 - boss.patternTimer) / 60);
    ctx.save();
    ctx.font = "bold 18px sans-serif";
    ctx.fillStyle = "white";
    ctx.textAlign = "right";
    ctx.shadowBlur = 5;
    ctx.shadowColor = "black";
    ctx.fillText(`다음 공격: ${timeLeft.toFixed(1)}s`, canvas.width - 20, 30);

    // 타이머 바 (시각적 효과)
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.fillRect(canvas.width - 120, 40, 100, 5);
    ctx.fillStyle = (timeLeft < 1) ? "#ff2e63" : "#00d2ff"; // 1초 미만일 때 빨간색으로 강조
    ctx.fillRect(canvas.width - 120, 40, 100 * (timeLeft / 3), 5);
    ctx.restore();
}

function spawnMissile() {
    // 플레이어(패들)의 현재 중앙 위치를 목표로 설정하여 난이도 상향 (요구사항)
    const targetX = paddleX + currentPaddleWidth / 2;
    const count = 3;
    for (let i = 0; i < count; i++) {
        let startX = boss.x + (boss.width / count) * i + (boss.width / (count * 2));
        let startY = boss.y + boss.height;

        // 패들까지 도달하는 시간(프레임)을 대략 100프레임으로 계산하여 조준 사격
        let dx = (targetX - startX) / 100;

        bossMissiles.push({
            x: startX,
            y: startY,
            speedY: 3 + Math.random() * 2,
            speedX: dx + (Math.random() - 0.5) * 1, // 조준 값에 약간의 오차 부여
            radius: 5
        });
    }
}

function spawnAreaAttack() {
    // 플레이어가 피할 수 있는 한 곳을 제외하고 공격 (Phase 2 요구사항)
    const safeZoneWidth = 150;
    const safeX = Math.random() * (canvas.width - safeZoneWidth);

    // 공격 구역 생성 (이전과 동일하지만 safeInfo를 추가하여 방공호 연출에 활용)
    const safeInfo = { x: safeX, w: safeZoneWidth };

    bossAreaAttacks.push({ x: 0, y: paddleY - 40, w: safeX, h: 80, timer: 150, safeInfo: safeInfo });
    bossAreaAttacks.push({ x: safeX + safeZoneWidth, y: paddleY - 40, w: canvas.width - (safeX + safeZoneWidth), h: 80, timer: 150 });
}

function spawnBossBall() {
    // 보스가 던지는 패턴 (패들을 조준하도록 수정)
    const targetX = paddleX + currentPaddleWidth / 2;
    const startX = boss.x + boss.width / 2;
    const startY = boss.y + boss.height;
    const dy = 4;

    // 패들까지 도달하는 프레임 계산하여 dx 조절 (조준 사격)
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

function updateBossAttacks() {
    // 미사일 업데이트
    for (let i = bossMissiles.length - 1; i >= 0; i--) {
        let m = bossMissiles[i];
        m.x += m.speedX;
        m.y += m.speedY;

        // 패들 충돌 감지 (판정을 5px 아래로 낮춤)
        if (m.y + m.radius > paddleY + 5 && m.y < paddleY + paddleHeight &&
            m.x > paddleX && m.x < paddleX + currentPaddleWidth) {
            loseLife();
            bossMissiles.splice(i, 1);
            continue;
        }

        if (m.y > canvas.height) bossMissiles.splice(i, 1);
    }

    // 스위핑 레이저 업데이트 (기능 정지)
    bossSweepingLasers = [];

    // 구역 공격 업데이트
    for (let i = bossAreaAttacks.length - 1; i >= 0; i--) {
        bossAreaAttacks[i].timer--;
        if (bossAreaAttacks[i].timer < 0) bossAreaAttacks.splice(i, 1);
        else if (bossAreaAttacks[i].timer < 20) {
            // 공격 발동 시점 충돌 판정
            checkAreaCollision(bossAreaAttacks[i]);
        }
    }

    // 보스 공 업데이트
    for (let i = bossBalls.length - 1; i >= 0; i--) {
        let b = bossBalls[i];
        b.x += b.dx;
        b.y += b.dy;

        // 보스 본체 충돌 체크 (요구사항: 파란색 펜 영역 - 보스 이미지 본체)
        if (b.reflected &&
            b.x + b.radius > boss.x && b.x - b.radius < boss.x + boss.width &&
            b.y + b.radius > boss.y && b.y - b.radius < boss.y + boss.height) {
            if (checkBossHit(b)) {
                bossBalls.splice(i, 1);
                continue;
            }
        }

        // 벽 반사 (보스를 맞추지 못한 경우 천장 및 좌우 벽 반사)
        if (b.x + b.radius > canvas.width || b.x - b.radius < 0) b.dx = -b.dx;
        if (b.y - b.radius < 0) {
            b.dy = Math.abs(b.dy); // 천장 튕김
        }

        // 패들 반사 (상향된 패들 위치 기준)
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

        // 패들 충돌 감지
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

function spawnMachineGunBullet() {
    const targetX = paddleX + currentPaddleWidth / 2;
    const startX = boss.x + boss.width / 2;
    const startY = boss.y + boss.height;

    // 조준 사격 (속도 및 명중률 대폭 하향)
    const angle = Math.atan2(paddleY - startY, targetX - startX);
    const speed = 2.5;

    bossBullets.push({
        x: startX,
        y: startY,
        dx: Math.cos(angle) * speed + (Math.random() - 0.5) * 5, // 난사 범위 대폭 확대 (피하기 매우 쉬움)
        dy: Math.sin(angle) * speed,
        radius: 3 // 크기 축소로 판정 완화
    });
}

function checkLaserCollision(laser) {
    // 이제 레이저는 미사일로 관리되지만, 기본 로직 유지 (범위 체크)
    if (paddleX < laser.x + laser.w && paddleX + currentPaddleWidth > laser.x &&
        paddleY + 5 < laser.y + laser.h && paddleY > laser.y) {
        loseLife();
    }
}

function checkAreaCollision(area) {
    // 패들이 구역 안에 들어와 있는지 체크 (Y축 범위 겹침 확인)
    if (paddleX < area.x + area.w && paddleX + currentPaddleWidth > area.x &&
        paddleY < area.y + area.h && paddleY + paddleHeight > area.y) {
        loseLife();
    }
}

function checkBossHit(ball) {
    if (ball.x > boss.x && ball.x < boss.x + boss.width) {
        boss.health -= 5;
        boss.hitFlash = 15; // 타격 반응 시간 약간 상향
        if (boss.health <= 0) {
            showBossOutro("images/win_boss.png", "STAGE CLEAR!", "북한 보스를 물리쳤습니다! 위대한 승리입니다!");
        }

        // 피격 대사 출력 (요구사항: "간나")
        showBossSpeech("간나!");

        return true; // 히트 성공 반환
    }
    return false;
}

function loseLife() {
    // 무적 상태라면 무시
    if (playerInvincibleTimer > 0) return;

    lives--;
    livesDisplay.innerText = lives;
    playerInvincibleTimer = 90; // 약 1.5초 무적 설정

    if (lives <= 0) {
        if (currentLevel === 2) {
            showBossOutro("images/loss_boss.png", "게임 오버", "보스에게 패배했습니다. 다시 도전해 보세요!");
        } else {
            showModal("게임 오버", "모든 목숨을 잃었습니다.", true);
        }
    } else {
        // 보스전 중에는 모달을 안 띄움 (요구사항)
        if (currentLevel !== 2) {
            showModal("아야!", "공격에 당했습니다!", false);
        }
    }
}

function drawBossAttacks() {
    // 미사일 그리기 (화살표 모양)
    bossMissiles.forEach(m => {
        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-m.radius, -m.radius * 2);
        ctx.lineTo(m.radius, -m.radius * 2);
        ctx.closePath();
        ctx.fillStyle = "#ff00dd"; // 네온 핑크 미사일
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#ff00dd";
        ctx.fill();

        // 꼬리 화염 효과
        ctx.beginPath();
        ctx.moveTo(-m.radius / 2, -m.radius * 2);
        ctx.lineTo(0, -m.radius * 3 - (Math.random() * 5));
        ctx.lineTo(m.radius / 2, -m.radius * 2);
        ctx.fillStyle = "#ffaa00";
        ctx.fill();
        ctx.restore();
    });

    // 구역 공격 그리기 (낙하하는 빔 애니메이션 및 강화된 경고)
    bossAreaAttacks.forEach(a => {
        ctx.save();
        const areaColor = "255, 0, 0"; // 무조건 빨간색 (요구사항)

        if (a.timer > 20) {
            // 경고 단계 (요구사항: 붉은 경고 박스)
            const areaColor = "255, 0, 0";
            ctx.fillStyle = `rgba(${areaColor}, ${0.1 + Math.abs(Math.sin(a.timer / 10)) * 0.2})`;
            ctx.fillRect(a.x, a.y, a.w, a.h);
            ctx.strokeStyle = `rgba(${areaColor}, 0.5)`;
            ctx.lineWidth = 2;
            ctx.strokeRect(a.x, a.y, a.w, a.h);

            // 방공호 시각 효과 추가 (요구사항: 색상만 밝은 회색으로 변경 - 필터 적용)
            if (a.safeInfo) {
                ctx.save();
                // 캔버스 필터를 사용하여 원래 모양은 유지하고 색상만 밝은 회색으로 변환
                ctx.filter = 'grayscale(1) brightness(1.8)';
                ctx.globalAlpha = 0.5; // 게임 가시성을 위해 약간 투명하게 설정
                ctx.drawImage(bunkerImg, a.safeInfo.x, a.y, a.safeInfo.w, a.h);
                ctx.restore();
            }

            // 경고 텍스트 (너비가 너무 좁으면 생략 - 요규사항)
            if (a.timer % 40 < 20 && a.w > 100) {
                ctx.fillStyle = "white";
                ctx.font = "bold 16px sans-serif";
                ctx.textAlign = "center";
                ctx.fillText("! CAUTION !", a.x + a.w / 2, a.y + a.h / 2 + 5);
            }
        } else {
            // 발사 단계: 강력하게 쏟아지는 에너지 장막
            const beamGrad = ctx.createLinearGradient(0, a.y, 0, a.y + a.h);
            beamGrad.addColorStop(0, `rgba(${areaColor}, 0.8)`);
            beamGrad.addColorStop(1, "rgba(255, 255, 255, 0.2)");

            ctx.fillStyle = beamGrad;
            ctx.fillRect(a.x, a.y, a.w, a.h);

            // 지면 충격파 (Shockwave)
            ctx.beginPath();
            ctx.strokeStyle = "white";
            ctx.lineWidth = 3;
            let sw = (20 - a.timer) * 5; // 퍼져나가는 원
            ctx.arc(a.x + a.w / 2, a.y + a.h - 5, sw % 50, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    });

    // 미사일 그리기 (이미지로 교체 및 상하 반전 - 요규사항)
    bossMissiles.forEach(m => {
        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.rotate(Math.PI); // 미사일을 180도 회전시켜 아래를 향하게 함

        // 미사일 이미지 렌더링 (사이즈 10x30) - 변수명 오타 수정
        ctx.drawImage(missileImg, -5, -15, 10, 30);

        ctx.restore();

        // 미사일 뒤에 아주 희미한 가스 연기 효과 (꼬리 부분)
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
        ctx.fillStyle = "#ffaa00"; // 밝은 주황색
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#ffaa00";
        ctx.fill();
        ctx.closePath();
        ctx.shadowBlur = 0;
    });
}

// === 아이템 시스템 관련 함수 ===

function spawnItem(x, y) {
    const types = ["PADDLE", "MULTIBALL"];
    const type = types[Math.floor(Math.random() * types.length)];
    items.push({ x: x, y: y, type: type, radius: 10 });
}

function updateItems() {
    for (let i = items.length - 1; i >= 0; i--) {
        let item = items[i];
        item.y += 2; // 낙하 속도

        // 패들과의 충돌 감지 (상향된 패들 위치 기준)
        if (item.y + item.radius > paddleY && item.y < paddleY + paddleHeight &&
            item.x > paddleX && item.x < paddleX + currentPaddleWidth) {
            activatePowerUp(item.type);
            items.splice(i, 1);
        } else if (item.y > canvas.height) {
            items.splice(i, 1); // 화면 밖으로 나감
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

        // 아이템 텍스트 표시
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

        // 텍스트 설정 (사이즈 키움 - 20px)
        ctx.font = "bold 20px sans-serif";
        const padding = 15;
        const textWidth = ctx.measureText(b.text).width;
        const width = textWidth + padding * 2;
        const height = 40;

        // 박스
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, width, height, 12);
        ctx.fill();
        ctx.stroke();

        // 텍스트 렌더링 (꼬리 부분 삭제됨)
        ctx.fillStyle = "black";
        ctx.textAlign = "left";
        ctx.fillText(b.text, b.x + padding, b.y + 28);

        ctx.restore();
    });
}

function activatePowerUp(type) {
    if (type === "PADDLE") {
        currentPaddleWidth = paddleWidthBase * 2; // 2배로 길어짐
        paddleColor = "#2ecc71"; // 패들 색상을 초록색으로 변경

        if (paddleTimer) clearTimeout(paddleTimer);
        paddleTimer = setTimeout(() => {
            currentPaddleWidth = paddleWidthBase;
            paddleColor = "#e94560"; // 원래 색상으로 복구
        }, 5000); // 5초 유지
    } else if (type === "MULTIBALL") {
        // 아이템 하나만 먹어도 즉시 최대 3개까지 공이 늘어나도록 수정
        while (balls.length < 3) {
            let baseBall = balls[Math.floor(Math.random() * balls.length)] || balls[0];
            if (!baseBall) break;
            // 새로 생성되는 공들이 서로 다른 방향으로 퍼지도록 속도에 무작위성 부여
            balls.push({
                x: baseBall.x,
                y: baseBall.y,
                dx: -baseBall.dx * (0.5 + Math.random()),
                dy: baseBall.dy
            });
        }
    }
}

// 모달 표시 함수
function showModal(title, message, isGameOver = true) {
    gameRunning = false; // 게임 일시 정지
    modalTitle.innerText = title;
    modalMessage.innerText = message;
    modalBtn.innerText = isGameOver ? "새 게임 시작" : "계속하기";
    modal.style.display = "flex";
    modalBtn.focus(); // 엔터 키로 바로 버튼을 누를 수 있도록 포커스 추가

    // 버튼 클릭 이벤트 처리
    modalBtn.onclick = () => {
        modal.style.display = "none";
        if (isGameOver) {
            document.location.reload();
        } else {
            // 목숨이 남은 경우 게임 재개
            gameRunning = true;
            draw();
        }
    };
}

// 초기 벽돌 생성만 해둠
initBricks();
