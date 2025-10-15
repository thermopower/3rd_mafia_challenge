import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import { loadCurrentUser } from "@/features/auth/server/load-current-user";
import { CurrentUserProvider } from "@/features/auth/context/current-user-context";
import { ConcertProvider } from "@/features/common/contexts/concert-context";
import { BookingProvider } from "@/features/common/contexts/booking-context";
import { UserProvider } from "@/features/common/contexts/user-context";

export const metadata: Metadata = {
  title: "TicketGem - 콘서트 예매 플랫폼",
  description: "간편하고 빠른 콘서트 예매 서비스",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await loadCurrentUser();

  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="antialiased font-sans">
        <Providers>
          <CurrentUserProvider initialState={currentUser}>
            <ConcertProvider>
              <BookingProvider>
                <UserProvider>{children}</UserProvider>
              </BookingProvider>
            </ConcertProvider>
          </CurrentUserProvider>
        </Providers>
      </body>
    </html>
  );
}
