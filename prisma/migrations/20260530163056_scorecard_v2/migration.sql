/*
  Warnings:

  - Added the required column `communication` to the `Scorecard` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cultureFit` to the `Scorecard` table without a default value. This is not possible if the table is not empty.
  - Added the required column `interviewType` to the `Scorecard` table without a default value. This is not possible if the table is not empty.
  - Added the required column `problemSolving` to the `Scorecard` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recommendation` to the `Scorecard` table without a default value. This is not possible if the table is not empty.
  - Added the required column `technicalAbility` to the `Scorecard` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "InterviewType" AS ENUM ('PHONE_SCREEN', 'TECHNICAL', 'FINAL_ROUND');

-- CreateEnum
CREATE TYPE "Recommendation" AS ENUM ('STRONG_HIRE', 'HIRE', 'NO_HIRE', 'STRONG_NO_HIRE');

-- AlterTable
ALTER TABLE "Scorecard" ADD COLUMN     "communication" INTEGER NOT NULL,
ADD COLUMN     "concerns" TEXT,
ADD COLUMN     "cultureFit" INTEGER NOT NULL,
ADD COLUMN     "interviewType" "InterviewType" NOT NULL,
ADD COLUMN     "problemSolving" INTEGER NOT NULL,
ADD COLUMN     "recommendation" "Recommendation" NOT NULL,
ADD COLUMN     "strengths" TEXT,
ADD COLUMN     "technicalAbility" INTEGER NOT NULL;
