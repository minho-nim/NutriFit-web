# NutriFit

식사 기록, 영양 목표 관리, 메뉴 추천, 음식 도감과 밥친구 펫 육성을 제공하는 앱입니다.

## 공개 저장소와 배포

앱 소스와 GitHub Pages 배포 파일을 이 저장소 하나에서 관리합니다. 공개 저장소이므로 앱 소스, 서버 코드, 저장소 이력과 Pages에 배포되는 파일은 누구나 볼 수 있습니다.

- 앱: https://minho-nim.github.io/NutriFit-web/
- 소스: `app/`
- GitHub Pages 게시 위치: `main` 브랜치 루트

소스를 수정한 뒤 아래 명령으로 빌드 결과를 저장소 루트에 반영하고, 변경 사항을 `main`에 커밋하고 푸시하면 Pages가 갱신됩니다.

```sh
cd app
npm ci
npm run deploy:pages
```

## 비밀값과 사용자 데이터

`.env*` 파일은 Git에서 제외하며 `.env.example`에는 값이 없는 예시만 둡니다. API 키를 브라우저 코드나 공개 저장소에 넣지 마세요. AI 사진 분석은 기본 비활성화되어 있습니다. 식사·프로필·펫 데이터는 브라우저 LocalStorage에 저장되며 GitHub로 전송되지 않습니다.
