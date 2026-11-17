# M CORP EIP

사내 업무 포털입니다. Firebase Authentication의 이메일/비밀번호 계정으로 로그인하고 Cloud Firestore에 업무 기록을 저장합니다. 출퇴근 시각은 Firestore 서버 기준이며 업무 날짜는 한국 시간 기준입니다.

## 실행과 배포

1. Firebase 웹 앱 설정을 `.env.example`에 맞춰 `.env.local`에 저장합니다.
2. `pnpm install --frozen-lockfile`, `pnpm run lint`, `pnpm run build`를 실행합니다.
3. `firebase deploy --only firestore:rules --project <project-id>`로 규칙을 배포합니다.
4. `wrangler deploy`로 `dist/`를 Cloudflare Workers에 직접 배포합니다.

## 직원 등록

Firebase 콘솔의 Authentication에서 이메일/비밀번호로 직원을 추가합니다. Firestore에 `employees/{Authentication UID}` 문서를 만들고 `name`(문자열), `role`(문자열), `active`(불리언)를 설정합니다. 직원은 로그인 화면에서 자신의 비밀번호를 재설정할 수 있습니다. 접근을 중단하려면 해당 프로필의 `active`를 `false`로 변경합니다.

| 역할 | 권한 |
| --- | --- |
| `employee` | 자신의 결재 요청, 휴가, 경비, 출퇴근 기록 |
| `manager` (팀장) | 결재·휴가·경비 승인 및 반려, 전체 근태 조회 |
| `finance` | 전체 경비 조회 |
| `sales` | 영업 기록 등록 및 수주 단계 관리 |
| `warehouse` | 품목 등록 및 재고 수량 관리 |
| `admin` (최종관리자) | 결재·휴가·경비 승인 및 반려, 모든 업무 모듈의 관리 권한 |

관리 역할에는 직원 기본 권한도 포함됩니다. 결재·휴가·정산에서 작성자 본인의 승인 처리는 제한됩니다. 직원 및 역할 관리는 Firebase 콘솔에서 수행합니다.
