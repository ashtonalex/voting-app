-- CreateEnum
CREATE TYPE "Track" AS ENUM ('AI_INNOVATION_PREU', 'AI_ART_PREU', 'AI_TECHNICAL_PREU', 'AI_INNOVATION_UPPERSEC', 'AI_ART_UPPERSEC', 'AI_TECHNICAL_UPPERSEC');

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "track" "Track" NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teams_name_key" ON "teams"("name");

-- CreateIndex
CREATE UNIQUE INDEX "votes_email_teamId_key" ON "votes"("email", "teamId");

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
