"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ConcertDetailResponse } from "@/features/concert-detail/lib/dto";

interface ConcertDescriptionProps {
  concert: ConcertDetailResponse;
}

export const ConcertDescription = ({ concert }: ConcertDescriptionProps) => {
  const hasDescription = concert.description;
  const hasNotice = concert.notice;

  if (!hasDescription && !hasNotice) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
        상세 정보가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">상세 정보</h2>
      <Tabs defaultValue="description" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="description">공연 소개</TabsTrigger>
          <TabsTrigger value="notice">유의사항</TabsTrigger>
        </TabsList>
        <TabsContent value="description" className="space-y-4">
          <div className="rounded-lg border bg-card p-6">
            {hasDescription ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="whitespace-pre-wrap leading-relaxed">
                  {concert.description}
                </p>
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                공연 소개가 없습니다.
              </p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="notice" className="space-y-4">
          <div className="rounded-lg border bg-card p-6">
            {hasNotice ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="whitespace-pre-wrap leading-relaxed">
                  {concert.notice}
                </p>
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                유의사항이 없습니다.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
