# 어드민 API 명세 (백엔드 연동용)

어드민 화면은 `src/api/*.js` 함수만 부릅니다. 지금은 함수 안에서 `src/mocks/`의 예시 데이터를 돌려주고, 백엔드가 준비되면 **함수 안쪽만 `apiRequest`(src/lib/apiClient.js) 호출로 바꾸면** 화면은 그대로 동작합니다.

- 응답 필드: 각 api 파일 맨 위와 함수 위 주석이 기준입니다. 이 문서는 엔드포인트 목록과, 서버가 꼭 지켜야 할 규칙을 모은 것입니다.
- 경로는 제안입니다. 바꿔도 되고, 바뀌면 이 문서와 api 함수를 같이 고칩니다.
- 사용자 앱(Seoulaim_web)이 받는 데이터와 같은 것이 많으니 `Seoulaim_web/docs/admin-data.md`, `backend-integration.md`와 함께 봐 주세요.

## 공통

- **기본 주소**: 환경 변수 `VITE_API_URL`. 비어 있으면 mock으로 동작합니다.
- **로그인**: 운영자 계정 하나. `POST /admin/login`이 **httpOnly 세션 쿠키**를 설정하고, 모든 요청은 쿠키로 인증합니다(`credentials: 'include'`).
  - CORS: 어드민 도메인을 정확히 허용하고, `Access-Control-Allow-Credentials: true`를 켭니다.
  - 세션이 만료되면 `401`을 주세요. 어드민이 로그인 화면으로 보냅니다.
- **에러**: 상태 코드와 함께 `{ code, message?, details? }`를 보냅니다. 화면은 `code`로 분기합니다. 아래 표의 code는 mock이 이미 던지는 값입니다.
- **다국어 문구**: 어드민 API는 `{ en, ko, zh, ja }`를 **그대로** 주고받습니다. 어드민은 번역하지 않습니다(사용자 앱 API만 현재 언어로 골라 줍니다).
- **날짜**: 날짜는 `YYYY-MM-DD`(한국 날짜), 시각은 ISO 8601. 기간과 마감은 모두 **한국 시간** 기준입니다.
- **금액**: 원화 정수.
- **순서**: "순서" 요청은 그 목록의 **전체 id를 새 순서대로** 보냅니다.
- **이미지 URL**: 어드민이 올린 이미지·폰트 CSS는 **CORS를 허용**해야 합니다. 사용자 앱이 PDF를 만들 때 필요합니다.
- **목록 크기**: 지금은 목록을 통째로 받아 화면에서 거릅니다. 회원·결제·문의·메일 내역이 수천 건을 넘기 전에 서버 페이지네이션과 필터(기간, 상태, 검색어)로 바꿔야 합니다. 그때 함수 인자를 추가합니다.

### 꼭 확인할 것

- **쿠키 로그인과 도메인**: 세션 쿠키가 동작하려면 어드민과 API가 **같은 사이트**여야 합니다(예: `admin.seoulaim.com` + `api.seoulaim.com`, 쿠키 `SameSite=Lax; Secure; HttpOnly`). 어드민을 `*.vercel.app`에 두고 API를 다른 도메인에 두면 제3자 쿠키가 되어 Safari 등에서 막힙니다. 이 경우에는 Vercel rewrites로 `/api/*`를 백엔드로 프록시해 같은 출처로 만들어 주세요.
- **서버가 기준**: 화면이 하는 계산은 **보여주기용**입니다. 서버가 같은 규칙으로 다시 확인해야 합니다.
  - 환불 정책 확인과 처리 기한
  - 프로모션 게시 상태
  - 홍보 메일 야간 금지 (`lib/mailRules.js`)
  - 각종 입력 검사(필수 칸, URL 형식)
- **SVG 업로드 보안**: 스티커는 SVG도 올립니다. SVG에는 스크립트를 넣을 수 있으니 저장할 때 `<script>`, `on*` 속성, 외부 참조를 제거(sanitize)하고, 이미지는 어드민·앱과 **다른 도메인**(S3/CloudFront 등)에서 올바른 `Content-Type`으로 내려주세요.
- **본문은 일반 텍스트**: 문의 답변, 공지·홍보 메일 본문, 자동 메일 문구는 일반 텍스트(줄바꿈 포함)입니다. 메일 HTML로 만들 때 꼭 이스케이프하고, 줄바꿈만 `<br>`로 바꿔 주세요. 자동 메일의 `{nickname}` 같은 값도 이스케이프해서 넣습니다.
- **예약 시각**: 어드민은 운영자 브라우저 시각을 ISO로 바꿔 보냅니다. 서버는 이것을 한국 시간으로 해석해서 판단합니다.

## 로그인 — `api/session.js`

| 함수            | 요청                                   | 비고                                                        |
| --------------- | -------------------------------------- | ----------------------------------------------------------- |
| getAdminSession | `GET /admin/session`                   | 로그아웃 상태여도 200 `{ loggedIn: false }`                 |
| login           | `POST /admin/login` `{ id, password }` | 실패 `INVALID_CREDENTIALS`. 비밀번호는 서버에만 (해시 저장) |
| logout          | `POST /admin/logout`                   |                                                             |

## 대시보드 — `api/dashboard.js`

| 함수         | 요청                   | 비고                                                                                                                                                                                    |
| ------------ | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| getDashboard | `GET /admin/dashboard` | 플랜 만족도 평균과 이번 주 응답 수, 오늘·어제 가입자 수, 이번 달·지난달 결제 건수와 금액, 최근 14일 일별 가입·결제, 답변 대기 문의, 처리 대기 환불. **모두 서버 집계** (한국 날짜 기준) |

## 업로드 — `api/uploads.js`

| 함수        | 요청                                            | 비고                                                                                                |
| ----------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| uploadImage | `POST /admin/uploads/images` (multipart `file`) | `{ url, width, height }`. 배너·장소·스티커(PNG/WebP/SVG)·템플릿 배경/장식 PNG. 공개 URL + CORS 허용 |

## 프로모션 — `api/promotions.js`

| 함수                     | 요청                                               | 비고                                           |
| ------------------------ | -------------------------------------------------- | ---------------------------------------------- |
| getPromotions(placement) | `GET /admin/promotions?placement=`                 | 없으면 전체(최신순), 있으면 그 위치의 순서대로 |
| getPromotion             | `GET /admin/promotions/{id}`                       |                                                |
| createPromotion          | `POST /admin/promotions`                           | 그 위치 맨 뒤에 추가, 켜진 상태                |
| updatePromotion          | `PATCH /admin/promotions/{id}`                     | 위치는 못 바꿈. 기본 배너는 기간 없음          |
| setPromotionEnabled      | `PATCH /admin/promotions/{id}` `{ enabled }`       | 기본 배너는 `DEFAULT_PROMOTION`                |
| deletePromotion          | `DELETE /admin/promotions/{id}`                    | 기본 배너는 `DEFAULT_PROMOTION`                |
| reorderPromotions        | `PUT /admin/promotions/order` `{ placement, ids }` |                                                |

**사용자 앱에 내려줄 때**: 기본 배너, 그리고 켜져 있고 기간 안(한국 시간, 종료일 23:59까지)인 배너만, 순서대로.

## 이벤트 — `api/events.js`

| 함수                                  | 요청                                   | 비고                               |
| ------------------------------------- | -------------------------------------- | ---------------------------------- |
| getCalendarEntries / getCalendarEntry | `GET /admin/calendar-entries`, `/{id}` | 팬캘린더 일정 + Event coming up    |
| create / update / deleteCalendarEntry | `POST`, `PATCH /{id}`, `DELETE /{id}`  | groupIds는 1개 이상 또는 `['all']` |
| getBirthdayCafes / getBirthdayCafe    | `GET /admin/birthday-cafes`, `/{id}`   |                                    |
| create / update / deleteBirthdayCafe  | `POST`, `PATCH /{id}`, `DELETE /{id}`  | memberId 필수                      |

**사용자 앱에 내려줄 때**:

- 팬캘린더 = `inCalendar`인 항목, Event coming up = 사진이 있는 항목
- 최애 그룹 기준으로 거르는 규칙은 events.js 주석을 따릅니다.

## 그룹·멤버 — `api/artists.js`

| 함수                      | 요청                                | 비고                                                                     |
| ------------------------- | ----------------------------------- | ------------------------------------------------------------------------ |
| getGroups / getGroup      | `GET /admin/groups`, `/{id}`        | 멤버 포함, 순서대로                                                      |
| createGroup / updateGroup | `POST`, `PUT /admin/groups/{id}`    | 그룹과 멤버를 한 번에 저장. id 없는 멤버는 새로 만들고, 빠진 멤버는 삭제 |
| deleteGroup               | `DELETE /admin/groups/{id}`         |                                                                          |
| reorderGroups             | `PUT /admin/groups/order` `{ ids }` |                                                                          |
| getGroupLinks             | `GET /admin/groups/{id}/links`      | 삭제 전 확인창용 개수                                                    |

**삭제할 때 서버가 같이 정리할 것**:

- 그룹을 지우면: 그 그룹만 지정한 일정·이벤트는 삭제, 여러 그룹에 걸린 것은 그 그룹만 빼기
- 멤버를 지우면: 그 멤버의 생일카페 삭제, 장소 멤버 태그에서 빼기, 회원 최애 목록에서 빼기
- 멤버 id는 한 번 만들면 바꾸지 않습니다.

## 장소·키워드 — `api/places.js`

| 함수                                             | 요청                                                   | 비고                                                                                                     |
| ------------------------------------------------ | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| getPlaces / getPlace                             | `GET /admin/places`, `/{id}`                           |                                                                                                          |
| geocodeAddress                                   | (서버 없음)                                            | 브라우저에서 네이버 지도 geocoder로 주소 → 좌표. 서버 Geocoding은 필요 없음                              |
| createPlace / updatePlace                        | `POST`, `PATCH /admin/places/{id}`                     | 좌표(lat/lng)는 **어드민이 찾아서 보냄** (네이버 지도 geocoder, Client ID만 사용). 서버 Geocoding 불필요 |
| setPlaceVisible                                  | `PATCH /admin/places/{id}` `{ visible }`               | 숨긴 장소는 새 플랜에서 빠짐 (이미 만든 플랜에는 남음)                                                   |
| deletePlace                                      | `DELETE /admin/places/{id}`                            | 회원 플랜에서도 빠짐                                                                                     |
| getKeywords                                      | `GET /admin/keywords`                                  | placeCount 포함                                                                                          |
| create / update / deleteKeyword, reorderKeywords | `POST`, `PATCH`, `DELETE`, `PUT /admin/keywords/order` | 키워드를 지우면 장소에서도 빠짐                                                                          |

## 다이어리 카탈로그 — `api/diary.js`

| 함수                                                              | 요청                                  | 비고                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------- |
| getTemplates / getTemplate                                        | `GET /admin/diary/templates`, `/{id}` | usedBy(그 템플릿을 쓰는 다이어리 수) 포함                                                   |
| createTemplate / updateTemplate                                   | `POST`, `PATCH /{id}`                 | 배경·장식 PNG는 **어드민이 SVG에서 만들어** 업로드한 URL을 보냄. 쓰인 템플릿의 칸 id는 유지 |
| setTemplateVisible, deleteTemplate, reorderTemplates              | `PATCH`, `DELETE`, `PUT /order`       | 사용자 앱에는 visible만                                                                     |
| getStickers                                                       | `GET /admin/diary/stickers`           | `{ categories, stickers }`                                                                  |
| create / update / deleteSticker, reorderStickers                  | `/admin/diary/stickers…`              |                                                                                             |
| create / update / deleteStickerCategory, reorderStickerCategories | `/admin/diary/sticker-categories…`    | 카테고리를 지워도 스티커는 남음                                                             |
| getFonts, create / update / deleteFont, reorderFonts              | `/admin/diary/fonts…`                 | 맨 위 폰트가 기본                                                                           |

## 회원 다이어리 열람·편집 다시 열기 — `api/memberDiaries.js`

| 함수                              | 요청                                                  | 비고                                                                                                                                               |
| --------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| openMemberDiary(diaryId, purpose) | `GET /admin/member-diaries/{id}?purpose=`             | purpose: `refund-review`·`reopen-review`만 허용. **열람 기록 저장**(누가, 언제, 왜). 스프레드·사진 URL·필요한 템플릿/스티커/폰트, 열람 기록을 함께 |
| reopenDiary(paymentId, reason)    | `POST /admin/payments/{id}/reopen-diary` `{ reason }` | 결제된 완성 다이어리만. completedAt을 비우고 기록 남김. "편집 다시 열림" 메일 발송. 환불 기간은 그대로                                             |

## 결제 — `api/payments.js`

| 함수        | 요청                                                    | 비고                                                                                                  |
| ----------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| getPayments | `GET /admin/payments` (나중에 `?from&to&status&q&page`) | 상태(결제 완료/환불 요청/환불됨), 환불 요청 id, 같은 다이어리의 다른 결제 수(중복 의심)를 서버가 계산 |

## 환불 — `api/refunds.js`

| 함수                                 | 요청                                                                                 | 비고                                                                                                                                                                                                                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| getRefundRequests / getRefundRequest | `GET /admin/refund-requests`, `/{id}`                                                | 환불 유형 문의 + 결제 + 다이어리                                                                                                                                                                                                                                         |
| approveRefund(id, exception)         | `POST /admin/refund-requests/{id}/approve` `{ exception: { reason, memo } \| null }` | **서버가 정책 다시 확인**: 요청 시각 기준 결제 7일 이내·완성 전. 정책 밖인데 예외가 없으면 `POLICY_EXCEPTION_REQUIRED`. 토스 결제 취소(실패 `REFUND_FAILED`) → 다이어리 처리(첫 다이어리는 3쪽부터 잠금, 그 외 삭제) → 환불 완료 메일. 이미 처리됐으면 `ALREADY_DECIDED` |
| rejectRefund(id, reason)             | `POST /admin/refund-requests/{id}/reject` `{ reason }`                               | 사유를 메일로                                                                                                                                                                                                                                                            |

- 어드민은 정책 확인(`policy`)과 처리 기한(`deadline`, 영업일 3일)을 `lib/refunds.js`로 **보여주기만** 합니다. 실제 판단은 서버가 합니다.

## 문의 — `api/inquiries.js`

| 함수                    | 요청                                            | 비고                                                    |
| ----------------------- | ----------------------------------------------- | ------------------------------------------------------- |
| getInquiries            | `GET /admin/inquiries`                          | 환불 유형은 빼고, 처리 대기 환불 수(refundCount)를 함께 |
| getInquiry              | `GET /admin/inquiries/{id}`                     | 회원이 쓴 앱 언어(language) 포함                        |
| answerInquiry(id, body) | `POST /admin/inquiries/{id}/answers` `{ body }` | 회원 이메일로 발송, 답변 완료로 바꿈                    |
| saveInquiryMemo         | `PATCH /admin/inquiries/{id}` `{ memo }`        | 회원에게 안 보임                                        |

## 만족도 조사 — `api/survey.js`

| 함수                       | 요청                                              | 비고                                                                                                                                                                                                                |
| -------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| getSurvey                  | `GET /admin/survey`                               | 안내 팝업 문구(invite: 제목·내용, 4개 언어)와 질문 목록(순서대로), 질문별 응답 수                                                                                                                                   |
| saveSurvey(questions)      | `PUT /admin/survey` `{ questions, invite }`       | 전체 목록을 순서대로. 새 질문·보기는 id 없이 오면 서버가 만듦. 응답이 있는 질문은 삭제 불가 → `archived`(숨김)로만 (`QUESTION_HAS_ANSWERS`). 영어 문구 필수, 고르기 질문은 보기 2개 이상 (`INVALID_SURVEY`)         |
| getSurveyResults(range)    | `GET /admin/survey/results?from&to`               | 질문(숨긴 것 포함), 기간 안 응답(응답 당시 플랜 정보 포함), 팝업 통계(플랜 만든 회원 수, 응답 수, 노출·닫기·오늘 하루 보지 않기 횟수). 응답이 많아지면 질문별 합계를 서버가 계산해서 줘도 됨 (`lib/survey.js` 참고) |
| markGiftsSent(responseIds) | `POST /admin/survey/gifts/sent` `{ responseIds }` | 운영자가 응답자 이메일로 기프티콘을 보낸 뒤 "발송 완료"로 표시 (누가, 언제). 응답마다 gift `{ status, sentAt, adminName }`, 응답에는 받을 이메일(가입 이메일)이 함께                                                |
| setSurveyEnabled(enabled)  | `PATCH /admin/survey` `{ enabled }`               | 앱에 안내 팝업을 띄울지 켜고 끔. 꺼져 있으면 사용자 앱 설문 API가 "띄우지 않음"으로 응답. 응답·결과는 그대로                                                                                                        |

**사용자 앱 팝업 (백엔드가 횟수·상태 기록)**:

- 어드민에서 팝업을 **껐으면 띄우지 않습니다**(`enabled`).
- 먼저 **안내 팝업**(invite 문구: "설문에 참여하시면 연동된 이메일로 아메리카노 기프티콘을 보내드립니다")을 띄우고, **예**를 누르면 설문 화면으로 이동합니다.
- 플랜을 만든 회원에게, 플랜을 만든 뒤 **두 번째 TRAVEL 방문부터** 띄웁니다. 방문 횟수는 서버에 기록합니다.
- 응답하면 다시 띄우지 않습니다(1인 1플랜이라 1번).
- 닫기(X): 다음 TRAVEL 방문 때 다시 띄웁니다.
- 오늘 하루 보지 않기: 그날 자정(한국 시간)까지 띄우지 않습니다.
- 응답을 저장할 때 그 시점의 플랜 정보(여행 기간, 최애 그룹, 키워드, 장소 수)를 함께 저장합니다.
- 질문은 숨기지 않은 것만 순서대로, 회원 언어로 보냅니다.
- 노출, 예, 닫기, 오늘 하루 보지 않기, 응답 이벤트를 각각 기록합니다.
- 응답 1건당 기프티콘 1개(1인 1플랜이라 1인 1개). 받을 주소는 가입 이메일입니다.

## 회원 — `api/members.js`

| 함수                             | 요청                                                   | 비고                                                                                                                                  |
| -------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| getMembers(query)                | `GET /admin/members?q=` (나중에 기간·필터·페이지)      | 검색은 서버에서(닉네임·이름·이메일·ID). **이름·이메일은 가려서** 내려줌                                                               |
| getMember                        | `GET /admin/members/{id}`                              | 전체 정보. **열람 기록 저장**(개인정보 접속기록). 동의 이력, 수신 설정, 최애, 플랜, 다이어리(내용 없이 목록만), 결제, 문의, 계정 기록 |
| getWithdrawalChecks              | `GET /admin/members/{id}/withdrawal-checks`            | 처리 대기 환불, 7일 내 결제 수                                                                                                        |
| withdrawMember(id, reason, memo) | `POST /admin/members/{id}/withdraw` `{ reason, memo }` | 계정·다이어리·사진·플랜 삭제, 결제 기록은 5년 보관, 탈퇴 메일(사유 포함). 기록은 개인정보 없이 남김                                   |
| getWithdrawals                   | `GET /admin/withdrawals`                               |                                                                                                                                       |

## 메일 — `api/mail.js`

| 함수                                        | 요청                                                                       | 비고                                                                                                                                          |
| ------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| countRecipients(kind, audience)             | `POST /admin/mail/recipients/count`                                        | 홍보 메일은 마케팅 동의 회원만                                                                                                                |
| searchMembers                               | `GET /admin/members?q=`                                                    | 서비스 공지 "특정 회원"용                                                                                                                     |
| getCampaigns / getCampaign                  | `GET /admin/mail/campaigns`, `/{id}`                                       |                                                                                                                                               |
| saveCampaign(id, fields, mode, scheduledAt) | `POST` / `PUT /admin/mail/campaigns/{id}` `{ …fields, mode, scheduledAt }` | mode: draft·send·schedule. **서버가 다시 확인**: 홍보 메일은 동의 회원만, 밤 21시~8시면 `NIGHT_MARKETING`, 받는 사람이 없으면 `NO_RECIPIENTS` |
| cancelCampaign                              | `POST /admin/mail/campaigns/{id}/cancel`                                   | 예약만 취소 가능                                                                                                                              |
| sendTestMail(fields, language)              | `POST /admin/mail/test`                                                    | 운영자 이메일로                                                                                                                               |
| getAutoMails / updateAutoMail               | `GET /admin/mail/auto`, `PATCH /{id}`                                      | 문구만 수정. 발송 시점은 서버                                                                                                                 |

**메일 발송 (백엔드)**:

- 홍보 메일에는 제목 앞 `(광고)`, 발신자 정보, 수신 거부 링크가 들어가야 합니다. 수신 거부하면 회원의 marketing을 끄고 변경일을 기록합니다.
- 마케팅 동의 회원에게는 2년마다 수신 동의 확인 메일을 보냅니다.
- 회원의 앱 언어로 보내고, 그 언어 문구가 비어 있으면 영어로 보냅니다.
- **보내는 주소**: seoulaimkr@gmail.com을 SES 같은 서비스의 발신 주소로 쓰면 Gmail의 DMARC 검사에 걸려 스팸함으로 갑니다. 자체 도메인 주소(예: no-reply@seoulaim.com, SPF·DKIM·DMARC 설정)로 보내고, 답장 주소(Reply-To)를 seoulaimkr@gmail.com으로 두는 걸 권합니다.
