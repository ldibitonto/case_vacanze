-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "cancellationPolicy" TEXT NOT NULL DEFAULT 'Cancellazione gratuita fino a 7 giorni prima dell''arrivo. Dopo questa data, la prima notte non è rimborsabile.',
ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
