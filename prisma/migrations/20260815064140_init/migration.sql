-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "purchaserFirstName" TEXT NOT NULL,
    "purchaserLastName" TEXT NOT NULL,
    "purchaserEmail" TEXT NOT NULL,
    "purchaserPhone" TEXT NOT NULL,
    "arrivalExpectation" TEXT NOT NULL,
    "emergencyContactName" TEXT NOT NULL,
    "emergencyContactPhone" TEXT NOT NULL,
    "liabilitySignatureName" TEXT NOT NULL,
    "liabilitySignatureDate" TEXT NOT NULL,
    "parentGuardianWaiver" BOOLEAN NOT NULL DEFAULT false,
    "comments" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid',
    "paidAt" TIMESTAMP(3),
    "paidNote" TEXT,
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendee" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "ageCategory" TEXT NOT NULL,
    "ticketType" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "roommatePreference" TEXT,
    "dietaryRestrictions" TEXT,
    "phone" TEXT,
    "specialAccommodations" TEXT,
    "volunteerTasks" TEXT,
    "sundayNightAddOn" BOOLEAN NOT NULL DEFAULT false,
    "alcoholAddOn" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attendee_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Attendee" ADD CONSTRAINT "Attendee_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
