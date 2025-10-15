"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type AuthFormFooterProps = {
  mode: "login" | "signup";
};

export const AuthFormFooter = ({ mode }: AuthFormFooterProps) => {
  return (
    <div className="space-y-4">
      <Separator className="my-4" />

      {mode === "login" && (
        <div className="text-center text-sm text-muted-foreground">
          <p>
            비밀번호를 잊으셨나요?{" "}
            <Button
              variant="link"
              className="p-0 h-auto font-normal"
              onClick={() => {
                // TODO: 비밀번호 재설정 기능 추가
                alert("비밀번호 재설정 기능은 추후 추가될 예정입니다.");
              }}
            >
              비밀번호 재설정
            </Button>
          </p>
        </div>
      )}

      <div className="text-center text-sm text-muted-foreground">
        <p>
          문의사항이 있으신가요?{" "}
          <Button
            variant="link"
            className="p-0 h-auto font-normal"
            onClick={() => {
              // TODO: 고객센터 페이지로 이동
              alert("고객센터 페이지로 이동합니다.");
            }}
          >
            고객센터
          </Button>
        </p>
      </div>

      {/* 소셜 로그인 버튼 영역 (placeholder) */}
      <div className="space-y-2">
        <Separator className="my-4" />
        <p className="text-center text-sm text-muted-foreground">
          또는 소셜 계정으로 {mode === "login" ? "로그인" : "회원가입"}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            disabled
            onClick={() => {
              // TODO: 카카오 로그인 연동
            }}
          >
            카카오
          </Button>
          <Button
            variant="outline"
            disabled
            onClick={() => {
              // TODO: 구글 로그인 연동
            }}
          >
            구글
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2">
          소셜 로그인은 준비 중입니다.
        </p>
      </div>
    </div>
  );
};
