# Seoulaim admin

Seoulaim(설레임) 운영자용 PC 관리 사이트. 인수인계·규칙은 `CLAUDE.md`를 보세요.

## 명령어

```bash
npm install
npm run dev        # 개발 서버
npm run build      # 배포용 빌드 → dist/
npm run lint
npm run format
```

## 폴더 구조

```
src/
├── api/          화면이 부르는 함수 (지금은 mocks, 백엔드가 생기면 안쪽만 교체)
├── mocks/        예시 데이터(db.js)와 가짜 서버(server.js)
├── components/   공통 컴포넌트, layout/ (사이드바 레이아웃)
├── hooks/        useFetch 등
├── lib/          날짜·금액 표시, 문의 유형 등
├── pages/        화면 (메뉴별 폴더, LoginPage)
├── menu.js       사이드바 메뉴 = 라우트 목록
└── router.jsx
```

백엔드 연동: `docs/admin-api.md` (엔드포인트와 서버가 지킬 규칙), `.env.example`의 `VITE_API_URL`.

화면 폭 1024px 이상(노트북)에서는 사이드바가 항상 보이고, 그보다 좁으면 왼쪽 위 메뉴 버튼으로 엽니다.
