# Global Forbidden Rules (공통 참조)

simon-bot 스킬 패밀리 전체에서 공유하는 금지 규칙. 모든 스킬은 이 파일을 참조한다.

## ABSOLUTE FORBIDDEN — 어떤 상황에서도 예외 없이 금지

되돌릴 수 없는 데이터 손실, 보안 경계 파괴, 임의 코드 실행을 방지한다.

- `git push --force` / `git push -f` — 다른 사람의 커밋을 영구 삭제할 수 있음
- `git merge` to main/master branch — 리뷰 없이 프로덕션 코드가 변경됨
- `rm -rf` — 복구 불가능한 파일 삭제
- `DROP TABLE` / `TRUNCATE` — 복구 불가능한 데이터 손실
- Commit `.env` or secret files — 시크릿이 git 히스토리에 영구 기록됨
- `chmod 777` — 모든 사용자에게 전체 권한을 부여하여 보안 경계가 무너짐
- `eval` with untrusted input — 임의 코드 실행 취약점 (RCE)
- `curl | sh` or `wget | sh` — 검증 없이 원격 코드를 실행
- Any test that calls real DB or external API — 테스트가 실제 시스템에 부작용을 일으키면 프로덕션 데이터가 손상되거나 외부 서비스에 의도치 않은 요청이 발생한다. mock/stub만 사용하라.

## Runtime Guard (P-008)

에이전트가 지시문을 잊거나 무시하는 것을 구조적으로 방지한다:
- **Git Diff 기반 스코프 검증**: 리뷰/검증 Step 진입 시 변경 파일만 대상으로 작업
- **Auto-Verification Hook 준수 확인**: 소스코드 수정 후 빌드/린트 실행 여부 재확인
- **Anti-Hallucination**: 읽지 않은 파일에 대한 의견 제시를 감지하면 즉시 중단하고 Read 실행

## CONTEXT-SENSITIVE — 대상을 검증한 후 판단

실행 전에 대상이 안전한지(localhost, 테스트 서버, 로컬 DB 등) 확인한다. 판단 근거를 `.claude/memory/audit-log.md`에 기록한다.

- `curl`/`wget` to external endpoints — 대상이 localhost 또는 테스트 서버인지 확인 후 실행. 프로덕션 엔드포인트는 ABSOLUTE FORBIDDEN.
- `mysql`/`psql`/`redis-cli`/`mongosh` — 대상이 로컬 개발용 DB인지 확인 후 실행. 프로덕션/스테이징 DB는 ABSOLUTE FORBIDDEN.
- `ssh`/`scp`/`sftp` — 대상이 로컬 테스트 환경인지 확인 후 실행. 프로덕션 서버는 ABSOLUTE FORBIDDEN.

## AUDIT-REQUIRED — 실행 가능하나 감사 로그에 기록

의도치 않은 부작용을 추적하기 위해 실행 내역을 `.claude/memory/audit-log.md`에 기록한다.

- 특정 파일 삭제 (`rm` 단일 파일) — 삭제 대상과 사유를 기록
- DB 읽기 전용 쿼리 (SELECT) — 쿼리 내용과 대상 DB를 기록
- 환경 변수 변경 — 변경 전후 값을 기록
