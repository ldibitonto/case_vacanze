-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "guestAddress" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "guestSurname" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "guestsCount" INTEGER NOT NULL DEFAULT 1;
