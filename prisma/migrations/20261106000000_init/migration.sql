-- CreateTable
CREATE TABLE "professionals" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "specialty" VARCHAR(80) NOT NULL,

    CONSTRAINT "professionals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" SERIAL NOT NULL,
    "professional_id" INTEGER NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "starts_at" TIMESTAMP(6) NOT NULL,
    "duration_minutes" INTEGER NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "appointments_professional_id_starts_at_idx" ON "appointments"("professional_id", "starts_at");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "professionals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

