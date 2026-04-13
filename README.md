# 🧱 HTML5 아케이드 벽돌깨기 & 보스 레이드전
**[웹 프로그래밍 과제 발표 자료]**

---

## 🎮 1. 프로젝트 개요 (Introduction)

> 아케이드 벽돌깨기와 보스전이 결합된 웹 게임

*   **프로젝트명:** Sil Me Do (실미도)
*   **장르:** 2D 아케이드 / 탄막 슈팅
*   **개발 링크:** https://nile27.github.io/kosta-html5/
*   **개발 목표:** 
    *   HTML5 Canvas API 활용
    *   바닐라 자바스크립트(Vanilla JS)를 이용한 게임 요소(충돌 물리, 루프, 상태 관리)  구현
   

---

## 🛠️ 2. 기술 스택 (Tech Stack)

*   **Front-end:** HTML5, CSS3, JavaScript (ES6+)
*   **Rendering:** HTML5 `<canvas>` & `requestAnimationFrame` (60FPS 렌더링)
*   **Environment:** 웹 브라우저 환경 (PC 기준)

---

## ✨ 3. 핵심 기능 및 특징 (Core Features)

1.  **2-stage 스테이지 구성**
    *   **1 stage:** 벽돌 파괴 및 아이템 파밍 (패들 크기 확장, 공 추가)
    *   **2 stage:** 보스전 레이드 스테이지
2.  **물리 엔진 구현 (Physics)**
    *   AABB (Axis-Aligned Bounding Box) 충돌 구조
    *   패들 타격 위치(hitPos) 기반 공 반사각 계산
3.  **패턴 기반 보스 인공지능 (AI Boss)**
    *   보스 체력(Phase 1~4) 구간별 이동 속도 및 동작 제어
    *   유도탄, 영역 공격, 미사일, 기관총 등 4가지 공격 패턴 구현

---

## 🏗️ 4. 시스템 아키텍처 및 디렉토리 구조 (Architecture)

단일 파일 작성을 지양하고, 기능 단위별로 **JS 모듈을 분리**하여 개발했습니다.

```text
📁 brick-breaker-classic/ (프로젝트 루트)
 ├── 📄 index.html      # 화면 골격 (Canvas 및 UI 컨테이너)
 ├── 📄 style.css       # 화면 UI 레이아웃
 ├── 📁 images/         # 배경화면, 보스 등 이미지 리소스
 └── 📁 js/             # 게임 관련 스크립트 폴더
      ├── config.js     # 전역 상태(점수, 생명력), 설정 변수
      ├── bricks.js     # 1스테이지 벽돌 배열 생성 및 충돌 판정
      ├── player.js     # 패들 조작, 무적 시간, 생명력 관리
      ├── items.js      # 보조 버프 아이템 낙하 및 적용 로직
      ├── boss.js       # 2스테이지 보스 AI, 다중 패턴 제어, 투사체 처리
      ├── ui.js         # 결과 창 모달 및 컷씬 표시 로직
      └── game.js       # 메인 루프 (Main Controller, 60FPS 렌더링 관리)
```

---

## 💡 5. 주요 기술 구현 포인트 (Tech Specs)

### ① AABB (Axis-Aligned Bounding Box) 충돌 감지 알고리즘
*   축에 평행한 객체(사각형 또는 원)들의 상하좌우 경계값이 서로 교차하는지를 `x, y` 좌표로만 판별하는 빠르고 직관적인 충돌 감지 기법입니다.
*   본 프로젝트에서는 벽돌과 공, 보스 투사체와 패들 간의 물리적 충돌 여부를 단순한 `if` 조건문으로 연산하여 성능 부하를 줄였습니다.
```javascript
// bricks.js - AABB 기반 공과 벽돌의 충돌 범위 검사
if (ball.x + ballRadius > b.x &&                  // 공의 우측 > 벽돌의 좌측
    ball.x - ballRadius < b.x + brickWidth &&     // 공의 좌측 < 벽돌의 우측
    ball.y + ballRadius > b.y &&                  // 공의 하단 > 벽돌의 상단
    ball.y - ballRadius < b.y + brickHeight) {    // 공의 상단 < 벽돌의 하단
    
    // 네 가지 조건이 모두 만족될 때 '충돌'로 판정하여 처리
    ball.dy = -ball.dy; 
    b.status = 0;       
}
```

### ② 배열 기반 투사체 관리 로직
*   보스가 발사하는 미사일과 유도탄은 개별 객체로 생성되어 배열에 저장됩니다.
*   프레임 단위로 화면을 이탈하거나 충돌된 투사체를 배열에서 제거하여 성능 저하를 방지합니다.
```javascript
// boss.js - 투사체 이동 및 피격 판정 로직
for (let i = bossMissiles.length - 1; i >= 0; i--) {
    let m = bossMissiles[i];
    m.y += m.speedY; // 투사체 이동 방향 반영

    // 플레이어 패들과의 충돌 영역 검사
    if (m.y + m.radius > paddleY + 5 && m.x > paddleX && m.x < paddleX + currentPaddleWidth) {
        loseLife();                // 체력 감소 함수 호출
        bossMissiles.splice(i, 1); // 명중한 투사체를 배열에서 제거
        continue;
    }
}
```

### ③ 다단 히트 방지를 위한 무적 프레임 (Invincibility Frame) 알고리즘
*   연속적인 피해를 차단하고자, 피격 시 약 1.5초(90프레임) 단위의 무적 타이머를 부여합니다.
```javascript
// player.js - 무적 타이머 조건 검사
function loseLife() {
    if (playerInvincibleTimer > 0) return; // 타이머가 활성화되어 있으면 무시

    lives--; // 목숨 감소
    playerInvincibleTimer = 90; // 무적 시간 90프레임 적용
    // ...
}

// game.js - 메인 루프의 타이머 동작
function draw() {
    // 렌더링 루프마다 타이머 1씩 감산
    if (playerInvincibleTimer > 0) playerInvincibleTimer--; 
    // ...
}
```

### ④ 보스 AI 패턴 방지 알고리즘
*   `Math.random()`으로 패턴을 선택하되, `do-while`문을 결합해 특정 행동(THROW)이 중복 발생하지 않도록 설정했습니다.
```javascript
// boss.js - 보스 AI 패턴 선택
if (boss.patternTimer > 180) { // 정해진 프레임 주기로 패턴 변경
    boss.patternTimer = 0;
    const patterns = ['MISSILE', 'AREA', 'THROW', 'MACHINEGUN'];
    let nextPattern;
    
    // 직전 패턴이 'THROW'일 때 동일 패턴 방지
    do {
        nextPattern = patterns[Math.floor(Math.random() * patterns.length)];
    } while (nextPattern === 'THROW' && boss.currentPattern === 'THROW');

    boss.currentPattern = nextPattern; // 다음 행동 갱신
}
```

### ⑤ 타격 위치에 따른 반사각 (Reflection) 차등 적용
*   공이 패들에 맞는 지점(중앙, 측면)에 따라 튕겨 나가는 X축 속도의 편차를 두도록 수식을 반영했습니다.
```javascript
// game.js - 단일 패들 타격 구간 물리 연산
let hitPos = (ball.x - (paddleX + currentPaddleWidth / 2)) / (currentPaddleWidth / 2);
ball.dx = hitPos * Math.abs(ball.dy) * 1.2; 

/* 
 * [동적 반사각 산출 공식]
 * 1. hitPos (타격 위치 비율) = (공의 X좌표 - 패들 정중앙 X좌표) / (패들 절반 길이)
 *    => 결과값: -1.0 (좌측 끝) ~ 0 (정중앙) ~ +1.0 (우측 끝)
 *
 * 2. ball.dx (최종 X축 이동 속도) = hitPos * 공의 수직 속력 * 가속도(1.2)
 *    => 즉, 패들 중앙에 맞으면 수직으로만 상승하고, 
 *       패들 양끝 가장자리에 맞을수록 좌우로 날카롭게 꺾어지는 당구공 같은 타격감 구현
 */
```



## 🚀 6. 데모 & 플레이 (Demo)

**"직접 플레이를 통한 결과 시연"**

*   **실행 링크:** https://nile27.github.io/kosta-html5/
*   **조작 키:** `←` / `→` (좌우 방향키)
*   **승리 조건:** 벽돌 스테이지 클리어 이후 보스의 체력을 0으로 소진시키기


