// === config.js: DOM 참조, 이미지 로드, 게임 상태 변수, 상수 ===

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
const introImg = document.getElementById("introImg");

// 이미지 로드
const stage1BgImg = new Image();
stage1BgImg.src = 'images/1stage_night.PNG';
const bossBgImg = new Image();
bossBgImg.src = 'images/boss_bg.png';
const bossImage = new Image();
bossImage.src = 'images/boss_cut.svg';
const bossHitImage = new Image();
bossHitImage.src = 'images/boss_3hit.svg';
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
let balls = [];
let baseSpeed = 3;

// 패들 (Paddle) 속성
const paddleHeight = 10;
const paddleWidthBase = 105;
let currentPaddleWidth = paddleWidthBase;
const paddleY = canvas.height - 40;
let paddleX = (canvas.width - currentPaddleWidth) / 2;
let paddleColor = "#e94560";

// 아이템 배열 및 타이머
let items = [];
let paddleTimer = null;

// 보스 객체
let boss = {
    x: 0,
    y: 50,
    width: 200,
    height: 40,
    health: 50,
    maxHealth: 50,
    speed: 3,
    direction: 1,
    active: false,
    hitFlash: 0,
    phase: 1,
    patternTimer: 0,
    currentPattern: 'IDLE',
    machineGunShots: 0
};

// 보스 이미지 로드 완료 시 히트박스 재조정
bossImage.onload = () => {
    boss.width = 120;
    boss.height = 160;
    boss.x = (canvas.width - boss.width) / 2;
    boss.maxHealth = 50;
    boss.health = 50;
};

// 보스 공격 요소
let bossMissiles = [];
let bossSweepingLasers = [];
let bossAreaAttacks = [];
let bossBalls = [];
let bossBullets = [];
let bossSpeechBubbles = [];

// 플레이어 상태
let playerInvincibleTimer = 0;

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
