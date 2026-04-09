# Playwright 데모 패턴 레퍼런스

시연용 Playwright 설정의 기술적 상세. SKILL.md에서 참조한다.

## 목차

- [브라우저 서버 패턴](#브라우저-서버-패턴-launchserver--connect)
- [엘리먼트 하이라이팅](#엘리먼트-하이라이팅)
- [딜레이 전략](#딜레이-전략)
- [시나리오 간 상태 정리](#시나리오-간-상태-정리)
- [비디오 녹화](#비디오-녹화)
- [MSW 브라우저 모킹](#msw-브라우저-모킹)
- [프로덕션 빌드 vs Dev 서버](#프로덕션-빌드-vs-dev-서버)

## 브라우저 서버 패턴 (launchServer + connect)

시나리오 간 브라우저를 유지하는 핵심 패턴. 각 시나리오 스크립트가 독립적으로 실행되면서도 같은 브라우저 세션을 공유한다.

### 서버 시작 (최초 1회)

```javascript
import { chromium } from 'playwright';
import fs from 'fs';

const server = await chromium.launchServer({
  headless: false,
  args: [
    '--start-maximized',
    '--window-position=0,0',
    '--window-size=1920,1080',
  ],
});

const wsEndpoint = server.wsEndpoint();
// wsEndpoint를 파일에 저장하여 다른 스크립트에서 참조
fs.writeFileSync('/tmp/playwright-demo-ws.txt', wsEndpoint);
console.log(`Browser server: ${wsEndpoint}`);
```

### 시나리오 스크립트에서 연결

```javascript
import { chromium } from 'playwright';
import fs from 'fs';

const wsEndpoint = fs.readFileSync('/tmp/playwright-demo-ws.txt', 'utf-8');
const browser = await chromium.connect(wsEndpoint);
const context = browser.contexts()[0] || await browser.newContext();
const page = context.pages()[0] || await context.newPage();

// 시나리오 동작 수행
await page.goto('http://localhost:3000/dashboard');
// ... 동작들 ...

// 스크립트 종료해도 브라우저는 유지됨 (disconnect, not close)
```

### 서버 종료 (시연 완료 후)

```javascript
const wsEndpoint = fs.readFileSync('/tmp/playwright-demo-ws.txt', 'utf-8');
const browser = await chromium.connect(wsEndpoint);
await browser.close(); // 브라우저 닫기
fs.unlinkSync('/tmp/playwright-demo-ws.txt');
```

---

## 엘리먼트 하이라이팅

시청자가 어디를 봐야 하는지 시각적 단서를 제공한다.

### 하이라이트 CSS 주입

시연 시작 시 한 번 주입:

```javascript
await page.addStyleTag({
  content: `
    .presenter-highlight {
      outline: 3px solid #FF6B6B !important;
      outline-offset: 3px;
      box-shadow: 0 0 20px rgba(255, 107, 107, 0.4) !important;
      transition: all 0.3s ease;
    }
    .presenter-highlight-pulse {
      animation: presenter-pulse 1.5s ease-in-out infinite;
    }
    @keyframes presenter-pulse {
      0%, 100% { box-shadow: 0 0 10px rgba(255, 107, 107, 0.3); }
      50% { box-shadow: 0 0 25px rgba(255, 107, 107, 0.6); }
    }
  `
});
```

### 동작 전 하이라이트 → 동작 → 하이라이트 제거

```javascript
async function highlightAndAct(page, selector, action) {
  // 하이라이트
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (el) el.classList.add('presenter-highlight', 'presenter-highlight-pulse');
  }, selector);

  await page.waitForTimeout(1500); // 시청자가 볼 시간

  // 동작 수행
  await action();

  // 하이라이트 제거
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (el) el.classList.remove('presenter-highlight', 'presenter-highlight-pulse');
  }, selector);
}

// 사용 예시
await highlightAndAct(page, '#submit-btn', async () => {
  await page.click('#submit-btn');
});
```

---

## 딜레이 전략

### slowMo + waitForTimeout 조합

```javascript
// 기본 설정: 모든 동작 사이 200ms (빠르지만 눈에 보이는 속도)
const browser = await chromium.launch({
  headless: false,
  slowMo: 200,
});

// 핵심 순간에서 추가 대기
await page.fill('#email', 'admin@test.com');
await page.waitForTimeout(800);  // 입력값을 시청자가 확인할 시간

await page.click('#submit');
await page.waitForTimeout(2000); // 결과 화면을 충분히 보여줌
```

### 타이핑 효과 (폼 입력 시)

```javascript
async function typeSlowly(page, selector, text, delay = 80) {
  await page.click(selector);
  for (const char of text) {
    await page.keyboard.type(char, { delay });
  }
}

// 사용: 사용자가 실제로 타이핑하는 느낌
await typeSlowly(page, '#search', '서울 강남구 맛집');
```

---

## 시나리오 간 상태 정리

이전 시나리오의 상태가 다음 시나리오에 영향을 줄 수 있다.

```javascript
// 필요한 경우만 선택적으로 정리
async function cleanState(page, options = {}) {
  if (options.clearStorage) {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }
  if (options.clearCookies) {
    const context = page.context();
    await context.clearCookies();
  }
  // 특정 키만 제거
  if (options.removeKeys) {
    await page.evaluate((keys) => {
      keys.forEach(key => localStorage.removeItem(key));
    }, options.removeKeys);
  }
}
```

---

## 비디오 녹화

시연을 MP4로 녹화하여 나중에 공유할 수 있다.

```javascript
const context = await browser.newContext({
  recordVideo: {
    dir: './demo-recordings/',
    size: { width: 1280, height: 720 },
  },
});

// ... 시연 수행 ...

// 반드시 context를 close해야 비디오 파일이 저장됨
const page = context.pages()[0];
const videoPath = await page.video().path();
await context.close();
console.log(`녹화 저장: ${videoPath}`);
```

---

## MSW 브라우저 모킹

### 기본 설정

```javascript
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/dashboard', async () => {
    await new Promise(r => setTimeout(r, 600)); // 자연스러운 로딩
    return HttpResponse.json({
      totalUsers: 1247,
      revenue: 324000000,
      conversionRate: 3.2,
    });
  }),
];
```

### 스트리밍 응답 (SSE)

```javascript
http.get('/api/stream', () => {
  const stream = new ReadableStream({
    async start(controller) {
      const events = [
        { type: 'analysis', data: '데이터 수집 중...' },
        { type: 'analysis', data: '패턴 분석 중...' },
        { type: 'result', data: '분석 완료: 전환율 3.2% 상승' },
      ];
      for (const event of events) {
        // 자연스러운 불규칙 간격
        const delay = 500 + Math.random() * 1500;
        await new Promise(r => setTimeout(r, delay));
        const encoded = new TextEncoder().encode(
          `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`
        );
        controller.enqueue(encoded);
      }
      controller.close();
    },
  });
  return new HttpResponse(stream, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}),
```

### WebSocket 모킹

```javascript
import { ws } from 'msw';

const notifications = ws.link('ws://localhost:3000/ws');

export const wsHandlers = [
  notifications.addEventListener('connection', ({ client }) => {
    // 접속 시 환영 메시지
    client.send(JSON.stringify({ type: 'connected' }));

    // 주기적으로 알림 전송 (데모용)
    let count = 0;
    const interval = setInterval(() => {
      count++;
      client.send(JSON.stringify({
        type: 'notification',
        data: {
          id: count,
          message: `새로운 주문 #${1000 + count}`,
          timestamp: new Date().toISOString(),
        },
      }));
    }, 3000 + Math.random() * 2000); // 3~5초 간격

    client.addEventListener('close', () => clearInterval(interval));
  }),
];
```

---

## 프로덕션 빌드 vs Dev 서버

| 항목 | Dev 서버 | 프로덕션 빌드 |
|------|----------|--------------|
| HMR 간섭 | 소스 변경 시 리로드 위험 | 없음 |
| 로딩 속도 | 느림 (번들링 on-the-fly) | 빠름 |
| 에러 표시 | 개발 에러 오버레이 표시 | 깔끔한 에러 페이지 |
| 안정성 | 중간 | 높음 |

**시연 시 권장:**
```bash
# 안정적인 시연을 위해 프로덕션 빌드 사용
npm run build && npx serve out  # Next.js static export
npm run build && npx serve dist  # Vite
npm run build && npm start       # Next.js server mode
```

dev 서버를 써야 한다면 HMR 비활성화:
```javascript
// vite.config.ts
export default defineConfig({
  server: { hmr: false },
});

// next.config.js - Next.js는 env로 제어
// NEXT_HMR_DISABLE=true npm run dev (비공식)
```
