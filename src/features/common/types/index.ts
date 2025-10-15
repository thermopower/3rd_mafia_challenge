export type Concert = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type SeatCategory = {
  id: string;
  concertId: string;
  name: string;
  displayColor: string;
  price: number;
  createdAt: string;
  updatedAt: string;
};

export type Seat = {
  id: string;
  concertId: string;
  categoryId: string;
  seatLabel: string;
  createdAt: string;
  updatedAt: string;
  category?: SeatCategory;
};

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "expired";

export type BookingInfo = {
  id: string;
  reservationNumber: string;
  concertId: string;
  userId: string | null;
  status: BookingStatus;
  holdExpiresAt: string | null;
  confirmedAt: string | null;
  bookerName: string | null;
  bookerContact: string | null;
  totalPrice: number | null;
  createdAt: string;
  updatedAt: string;
  concert?: Concert;
  seats?: Seat[];
};

export type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};
