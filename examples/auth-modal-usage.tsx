/**
 * AuthModal 사용 예제
 *
 * UC-004: 로그인/회원가입 공용 모달
 *
 * 이 파일은 AuthModal을 사용하는 방법을 보여주는 예제입니다.
 */

"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/common/contexts/auth-context";

export default function AuthModalUsageExample() {
  const { openAuthModal } = useAuth();

  return (
    <div className="container mx-auto py-12 space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">AuthModal 사용 예제</h1>
        <p className="text-muted-foreground">
          아래 버튼을 클릭하여 로그인/회원가입 모달을 테스트하세요.
        </p>
      </div>

      <div className="flex gap-4">
        <Button
          onClick={() => openAuthModal("login")}
          size="lg"
        >
          로그인 모달 열기
        </Button>

        <Button
          onClick={() => openAuthModal("signup")}
          variant="outline"
          size="lg"
        >
          회원가입 모달 열기
        </Button>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">사용 방법</h2>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">1. 기본 사용</h3>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
{`import { useAuth } from "@/features/common/contexts/auth-context";

function MyComponent() {
  const { openAuthModal } = useAuth();

  return (
    <button onClick={() => openAuthModal("login")}>
      로그인
    </button>
  );
}`}
          </pre>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">2. Redirect와 함께 사용</h3>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
{`// 로그인 후 특정 페이지로 이동하고 싶을 때
const { openAuthModal } = useAuth();

// 찜하기 버튼에서 사용
const handleFavorite = () => {
  if (!isLoggedIn) {
    openAuthModal("login", "/concert/123");
  } else {
    // 찜하기 로직
  }
};`}
          </pre>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">3. 모달 닫기</h3>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
{`const { closeAuthModal } = useAuth();

// 모달을 프로그래밍적으로 닫기
closeAuthModal();`}
          </pre>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">주요 기능</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>이메일/비밀번호 기반 로그인</li>
          <li>이메일/비밀번호 기반 회원가입</li>
          <li>실시간 폼 검증 (react-hook-form + zod)</li>
          <li>로그인/회원가입 탭 전환</li>
          <li>비밀번호 재설정 링크 (placeholder)</li>
          <li>소셜 로그인 버튼 영역 (placeholder)</li>
          <li>Esc 키 또는 배경 클릭으로 닫기</li>
          <li>성공/실패 시 Toast 알림</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">테스트 계정</h2>
        <div className="bg-muted p-4 rounded-lg">
          <p className="font-medium">테스트를 위해 먼저 회원가입을 진행하세요:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>이메일: test@example.com</li>
            <li>비밀번호: Test1234! (8자 이상, 숫자와 특수문자 포함)</li>
            <li>이름: 테스트 사용자</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
