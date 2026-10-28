import { redirect } from "next/navigation";

export default function GuestBookingsRedirect() {
  redirect("/my-bookings");
}
