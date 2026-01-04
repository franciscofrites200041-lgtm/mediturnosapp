-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('ACTIVE', 'WAITING_HUMAN', 'HUMAN_HANDLING', 'CLOSED');

-- AlterTable
ALTER TABLE "whatsapp_conversations" ADD COLUMN     "assignedAt" TIMESTAMP(3),
ADD COLUMN     "assignedToUserId" TEXT,
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "humanRequestedAt" TIMESTAMP(3),
ADD COLUMN     "needsHumanAttention" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" "ConversationStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "whatsapp_conversations_needsHumanAttention_idx" ON "whatsapp_conversations"("needsHumanAttention");

-- AddForeignKey
ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
