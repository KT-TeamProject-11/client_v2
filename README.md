# 천안 도시재생지원센터 챗봇 (React + Vite)

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB.svg?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.3.4-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Chatbotify](https://img.shields.io/badge/Chatbotify-2.3.0-ff4081.svg)](https://github.com/walkxcode/react-chatbotify)
[![DOMPurify](https://img.shields.io/badge/DOMPurify-3.2.6-brightgreen.svg)](https://github.com/cure53/DOMPurify)

천안시 도시재생지원센터 전용 챗봇 **프론트엔드**입니다.  
React 기반 UI 프레임워크인 [react-chatbotify](https://github.com/react-chatbotify/react-chatbotify.git) 를 기반으로 커스터마이징했습니다.


---

## 목차
- [디렉터리 구조](#디렉터리-구조)
- [시작하기](#시작하기)
- [백엔드 연동](#백엔드-연동)
- [화면 예시](#화면-예시)

---

## 🤖 디렉터리 구조
```
frontend/
├─ __tests__/          
├─ assets/             # 정적 리소스
├─ cypress/            # E2E 테스트
├─ docs/               # 프로젝트 문서
├─ public/             
├─ scripts/            # 빌드/배포 스크립트
├─ src/                # 애플리케이션 소스
│  ├─ components/      # UI 컴포넌트
│  ├─ context/         # 전역 상태 관리
│  ├─ services/        # 서비스 로직
│  ├─ utils/           # 유틸 함수
│  └─ App.tsx / index.tsx
├─ ssr/                # 서버사이드 렌더링
├─ types/              
├─ .env                
├─ package.json
└─ vite.config.js
```

---

## 🚀 시작하기
### 1) 패키지 설치
```
npm install react-chatbotify --save
npm i dompurify
npm i -D @types/dompurify
````
### 2) 클라이언트 실행
```
npm start
```

---

## 🤖 백엔드 연동
- 별도 백엔드 레포 : [server](https://github.com/KT-TeamProject-11/server.git)
- 기본 API 서버 : http://localhost:8555/

---

## 🤖 화면 예시
<img src = "https://imgur.com/EZCYHhP.jpg" width="480px">

- **메시지 입력창 :** 사용자가 직접 질문 입력 가능
- **옵션 버튼 :** 인사말, 공지사항 등 주요 메뉴 원클릭으로 조회 가능
- **상단 헤더 :** 챗봇 로고 / 타이틀 + 스피커 버튼(TTS)
- **하단 영역 :** 입력창 + 마이크 버튼(STT)

