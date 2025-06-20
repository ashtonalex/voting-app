/*
  Warnings:

  - Added the required column `trackId` to the `votes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "votes" ADD COLUMN     "trackId" TEXT NOT NULL;
