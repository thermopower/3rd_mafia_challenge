"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReservationsPanel } from "./reservations-panel";
import { FavoritesPanel } from "./favorites-panel";

export const MyPageTabs = () => {
  return (
    <Tabs defaultValue="reservations" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="reservations" aria-label="내 예매 내역 탭">
          내 예매 내역
        </TabsTrigger>
        <TabsTrigger value="favorites" aria-label="찜한 콘서트 탭">
          찜한 콘서트
        </TabsTrigger>
      </TabsList>
      <TabsContent value="reservations" className="mt-6">
        <ReservationsPanel />
      </TabsContent>
      <TabsContent value="favorites" className="mt-6">
        <FavoritesPanel />
      </TabsContent>
    </Tabs>
  );
};
