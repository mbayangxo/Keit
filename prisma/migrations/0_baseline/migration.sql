-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'SN',
    "name" TEXT,
    "handle" TEXT,
    "statusText" TEXT,
    "currentSong" TEXT,
    "pinnedPhotos" JSONB,
    "arrondissementKey" TEXT,
    "arrondissementIcon" TEXT,
    "arrondissementName" TEXT,
    "avatarEmoji" TEXT,
    "avatarUrl" TEXT,
    "identityChoice" TEXT,
    "otpVerifiedAt" TIMESTAMP(3),
    "pinHash" TEXT,
    "passwordHash" TEXT,
    "pinFailedAttempts" INTEGER NOT NULL DEFAULT 0,
    "accountLockedAt" TIMESTAMP(3),
    "accountLockReason" TEXT,
    "frozenByAdminAt" TIMESTAMP(3),
    "adminFreezeReason" TEXT,
    "lastActivityAt" TIMESTAMP(3),
    "cniNumberEnc" TEXT,
    "biometricEnabled" BOOLEAN NOT NULL DEFAULT false,
    "stepUpVerifiedAt" TIMESTAMP(3),
    "isDiaspora" BOOLEAN NOT NULL DEFAULT false,
    "afriClass" TEXT,
    "verificationTier" INTEGER NOT NULL DEFAULT 1,
    "verificationStatus" TEXT NOT NULL DEFAULT 'phone_only',
    "cniVerifiedAt" TIMESTAMP(3),
    "addressVerifiedAt" TIMESTAMP(3),
    "dateOfBirth" TIMESTAMP(3),
    "cniHash" TEXT,
    "smsAlertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smsBalanceQueryEnabled" BOOLEAN NOT NULL DEFAULT true,
    "email" TEXT,
    "emailVerifiedAt" TIMESTAMP(3),
    "afriId" TEXT,
    "inviteCode" TEXT,
    "referredByUserId" TEXT,
    "studentPassSchool" TEXT,
    "studentPassBusinessId" TEXT,
    "studentPassStatus" TEXT,
    "studentPassRequestedAt" TIMESTAMP(3),
    "studentPassVerifiedAt" TIMESTAMP(3),
    "studentPassExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpCode" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "koriBalance" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KoriTransaction" (
    "id" TEXT NOT NULL,
    "senderId" TEXT,
    "recipientId" TEXT,
    "amountKori" INTEGER NOT NULL,
    "transactionType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "reference" TEXT NOT NULL,
    "note" TEXT,
    "attachmentUrl" TEXT,
    "attachmentType" TEXT,
    "giftCardTheme" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KoriTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KoriReserve" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "totalKoriInCirculation" INTEGER NOT NULL DEFAULT 0,
    "totalReserveHeldXof" INTEGER NOT NULL DEFAULT 0,
    "conversionsFrozen" BOOLEAN NOT NULL DEFAULT false,
    "lastReconciliationAt" TIMESTAMP(3),
    "lastReconciliationOk" BOOLEAN,
    "lastMismatchXof" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KoriReserve_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "counterpartyName" TEXT,
    "counterpartyHandle" TEXT,
    "note" TEXT,
    "attachmentUrl" TEXT,
    "attachmentType" TEXT,
    "giftCardTheme" TEXT,
    "reference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'merchant',
    "category" TEXT,
    "arrondissement" TEXT,
    "kebuId" TEXT,
    "description" TEXT,
    "statusText" TEXT,
    "address" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "imageUrl" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "acceptOrdersWhenOutOfStock" BOOLEAN NOT NULL DEFAULT false,
    "pauseOrders" BOOLEAN NOT NULL DEFAULT false,
    "lowStockAlertEnabled" BOOLEAN NOT NULL DEFAULT true,
    "distributionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessMember" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessCommunityStatus" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessCommunityStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessWallet" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessLedgerEntry" (
    "id" TEXT NOT NULL,
    "businessWalletId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "counterpartyBusinessId" TEXT,
    "counterpartyUserId" TEXT,
    "counterpartyName" TEXT,
    "counterpartyKebuId" TEXT,
    "note" TEXT,
    "reference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shopName" TEXT NOT NULL,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'offline',
    "vehicle" TEXT,
    "lastActiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "modes" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'active',
    "reputationScore" INTEGER NOT NULL DEFAULT 0,
    "totalEarnedNational" INTEGER NOT NULL DEFAULT 0,
    "completedJobs" INTEGER NOT NULL DEFAULT 0,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerReceipt" (
    "id" TEXT NOT NULL,
    "workerProfileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "sourceId" TEXT,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "amountNational" INTEGER NOT NULL,
    "koriAmount" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkerReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT,
    "businessId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "price" INTEGER NOT NULL,
    "category" TEXT,
    "inventory" INTEGER NOT NULL DEFAULT 0,
    "trackInventory" BOOLEAN NOT NULL DEFAULT true,
    "allowBackorder" BOOLEAN NOT NULL DEFAULT false,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "flashPrice" INTEGER,
    "flashExpiresAt" TIMESTAMP(3),
    "unitLabel" TEXT,
    "b2bPrice" INTEGER,
    "b2bMinQty" INTEGER NOT NULL DEFAULT 1,
    "saleChannel" TEXT NOT NULL DEFAULT 'both',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "businessId" TEXT,
    "buyerBusinessId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "channel" TEXT NOT NULL DEFAULT 'b2c',
    "paymentTerm" TEXT NOT NULL DEFAULT 'immediate',
    "paymentStatus" TEXT NOT NULL DEFAULT 'paid',
    "paidAmount" INTEGER NOT NULL DEFAULT 0,
    "paymentSource" TEXT NOT NULL DEFAULT 'personal',
    "preferredDeliveryDate" TIMESTAMP(3),
    "orderReference" TEXT,
    "fulfillmentType" TEXT NOT NULL DEFAULT 'delivery',
    "totalAmount" INTEGER NOT NULL,
    "deliveryAddress" TEXT,
    "hubId" TEXT,
    "notes" TEXT,
    "affiliateLinkCode" TEXT,
    "mboloThreadId" TEXT,
    "subtotalKori" INTEGER,
    "discountKori" INTEGER NOT NULL DEFAULT 0,
    "promoId" TEXT,
    "promoCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryHub" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "arrondissement" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'SN',
    "isWarehouse" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryHub_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubParcel" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "hubId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "externalRef" TEXT,
    "originCountry" TEXT NOT NULL,
    "originLabel" TEXT,
    "description" TEXT NOT NULL,
    "senderName" TEXT,
    "senderContact" TEXT,
    "status" TEXT NOT NULL DEFAULT 'registered',
    "fulfillmentPlan" TEXT NOT NULL DEFAULT 'pickup',
    "dropoffArea" TEXT,
    "dropoffAddress" TEXT,
    "dropoffLat" DOUBLE PRECISION,
    "dropoffLng" DOUBLE PRECISION,
    "pickupCode" TEXT,
    "lastMileOrderId" TEXT,
    "arrivedAt" TIMESTAMP(3),
    "pickedUpAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HubParcel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "isPromoFree" BOOLEAN NOT NULL DEFAULT false,
    "promoId" TEXT,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeAccount" (
    "id" TEXT NOT NULL,
    "supplierBusinessId" TEXT NOT NULL,
    "buyerUserId" TEXT NOT NULL,
    "buyerBusinessId" TEXT,
    "buyerLabel" TEXT,
    "buyerType" TEXT NOT NULL DEFAULT 'merchant',
    "paymentTerm" TEXT NOT NULL DEFAULT 'net30',
    "creditLimitKori" INTEGER NOT NULL DEFAULT 0,
    "codEnabled" BOOLEAN NOT NULL DEFAULT false,
    "trustTier" TEXT NOT NULL DEFAULT 'new',
    "codLimitKori" INTEGER NOT NULL DEFAULT 50000,
    "priceLockUntil" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradeAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeInvoice" (
    "id" TEXT NOT NULL,
    "supplierBusinessId" TEXT NOT NULL,
    "buyerUserId" TEXT NOT NULL,
    "buyerBusinessId" TEXT,
    "tradeAccountId" TEXT,
    "orderId" TEXT,
    "reference" TEXT NOT NULL,
    "amountKori" INTEGER NOT NULL,
    "amountPaid" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'open',
    "dueAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradeInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryTask" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "assignedDriverId" TEXT,
    "pickupType" TEXT NOT NULL DEFAULT 'merchant',
    "pickupLabel" TEXT,
    "pickupAddress" TEXT,
    "pickupLat" DOUBLE PRECISION,
    "pickupLng" DOUBLE PRECISION,
    "dropoffArea" TEXT NOT NULL,
    "dropoffExact" TEXT,
    "dropoffLat" DOUBLE PRECISION,
    "dropoffLng" DOUBLE PRECISION,
    "dropoffAddress" TEXT NOT NULL,
    "deliveryFeeNational" INTEGER NOT NULL DEFAULT 1500,
    "riderKoriEarnings" INTEGER NOT NULL DEFAULT 10,
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 25,
    "status" TEXT NOT NULL DEFAULT 'open',
    "pickedUpAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "buyerRating" INTEGER,
    "autoReleaseAt" TIMESTAMP(3),
    "hubId" TEXT,
    "productSummary" TEXT,
    "proofRecipientUserId" TEXT,
    "proofRecipientHandle" TEXT,
    "proofScannedPayload" TEXT,
    "proofSignatureUrl" TEXT,
    "proofPhotoUrl" TEXT,
    "proofLat" DOUBLE PRECISION,
    "proofLng" DOUBLE PRECISION,
    "proofSubmittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryEscrow" (
    "id" TEXT NOT NULL,
    "deliveryTaskId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "riderId" TEXT,
    "amountNational" INTEGER NOT NULL,
    "koriPayout" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'reserved',
    "reference" TEXT NOT NULL,
    "reservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryEscrow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryDispute" (
    "id" TEXT NOT NULL,
    "deliveryTaskId" TEXT NOT NULL,
    "openedByUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "holdUntil" TIMESTAMP(3) NOT NULL,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryDispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryDisputeEvidence" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryDisputeEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "promoterId" TEXT NOT NULL,
    "businessId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "venue" TEXT,
    "coverImageUrl" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "ticketPrice" INTEGER NOT NULL,
    "capacity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'paid',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketPass" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "scanCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'valid',
    "checkedInAt" TIMESTAMP(3),
    "checkedInBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketPass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolidarityCampaign" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "beneficiaryUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "story" TEXT,
    "goalAmount" INTEGER NOT NULL,
    "raisedAmount" INTEGER NOT NULL DEFAULT 0,
    "kind" TEXT NOT NULL DEFAULT 'jekkal',
    "coverPhotoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "fundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SolidarityCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolidarityContribution" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "message" TEXT,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "reference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SolidarityContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MboloThread" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "name" TEXT,
    "type" TEXT NOT NULL DEFAULT 'direct',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MboloThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MboloMember" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MboloMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MboloMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "kind" TEXT NOT NULL DEFAULT 'text',
    "mediaUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MboloMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TontineGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amountPerMember" INTEGER NOT NULL,
    "frequency" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "potBalance" INTEGER NOT NULL DEFAULT 0,
    "rotationIndex" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "nextDueAt" TIMESTAMP(3),
    "lastProcessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TontineGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TontineMembership" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rotationOrder" INTEGER NOT NULL,
    "hasReceivedPayout" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TontineMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TontineContribution" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cycleKey" TEXT NOT NULL,
    "amountKori" INTEGER NOT NULL,
    "reference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TontineContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "kind" TEXT,
    "refId" TEXT,
    "actionLabel" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegionalAlert" (
    "id" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "guidance" TEXT,
    "country" TEXT NOT NULL DEFAULT 'SN',
    "regionKeys" TEXT[],
    "regionLabel" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegionalAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertRead" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertRead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrendingArticle" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "body" TEXT,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "country" TEXT NOT NULL DEFAULT 'SN',
    "regionKeys" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "signatureTarget" INTEGER,
    "signatureCount" INTEGER NOT NULL DEFAULT 0,
    "trendScore" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrendingArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoneyRequest" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "payerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'national',
    "purposeCategory" TEXT,
    "note" TEXT,
    "voiceNoteUrl" TEXT,
    "photoUrl" TEXT,
    "videoUrl" TEXT,
    "lockToBusinessId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reference" TEXT NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MoneyRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantVoucher" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "balanceKori" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantVoucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantPromo" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "code" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "percentBps" INTEGER,
    "fixedOffKori" INTEGER,
    "triggerProductId" TEXT,
    "buyQty" INTEGER,
    "freeProductId" TEXT,
    "freeQty" INTEGER NOT NULL DEFAULT 1,
    "minOrderKori" INTEGER,
    "maxUses" INTEGER,
    "usesCount" INTEGER NOT NULL DEFAULT 0,
    "perUserMax" INTEGER NOT NULL DEFAULT 1,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "onlineOnly" BOOLEAN NOT NULL DEFAULT false,
    "inPersonOnly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantPromo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantPromoUse" (
    "id" TEXT NOT NULL,
    "promoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "reference" TEXT NOT NULL,
    "discountKori" INTEGER NOT NULL DEFAULT 0,
    "channel" TEXT NOT NULL DEFAULT 'online',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantPromoUse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductView" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentFund" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "balanceKori" INTEGER NOT NULL DEFAULT 0,
    "targetKori" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentFund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledPayment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fundId" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'send',
    "recipientHandle" TEXT,
    "recipientId" TEXT,
    "amountKori" INTEGER NOT NULL,
    "note" TEXT,
    "scheduleType" TEXT NOT NULL,
    "scheduleDay" INTEGER NOT NULL,
    "nextRunAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RailTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'julaya',
    "direction" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "operator" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "externalId" TEXT,
    "reference" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "walletDebited" BOOLEAN NOT NULL DEFAULT false,
    "failureReason" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RailTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiIdempotency" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "responseJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiIdempotency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "statusCode" INTEGER,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRateLimit" (
    "userId" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "blockedUntil" TIMESTAMP(3),
    "flagCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserRateLimit_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "UserDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deviceName" TEXT,
    "ip" TEXT,
    "countryCode" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeldTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "operationType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_review',
    "amountNational" INTEGER NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "flagsJson" TEXT NOT NULL,
    "userMessage" TEXT NOT NULL,
    "reviewNote" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reference" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeldTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "heldTransactionId" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'high',
    "code" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "acknowledgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FraudAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CniVerificationJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalJobId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "verifiedLegalName" TEXT,
    "verifiedDateOfBirth" TIMESTAMP(3),
    "documentNumberHash" TEXT,
    "failureReason" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "imagesPurgedAt" TIMESTAMP(3),
    "purgeImagesAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CniVerificationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDailyUsage" (
    "userId" TEXT NOT NULL,
    "usageDate" TEXT NOT NULL,
    "sentNational" INTEGER NOT NULL DEFAULT 0,
    "cashOutNational" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDailyUsage_pkey" PRIMARY KEY ("userId","usageDate")
);

-- CreateTable
CREATE TABLE "SmsMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "phone" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "provider" TEXT,
    "externalId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "purpose" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmsMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecureLog" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "title" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecureLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "totpSecretEnc" TEXT,
    "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "totpConfirmedAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "totpVerified" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "detailJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "channel" TEXT NOT NULL DEFAULT 'app',
    "csPhone" TEXT,
    "assignedAdminId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicketMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorType" TEXT NOT NULL,
    "authorAdminId" TEXT,
    "authorUserId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportTicketMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportCallLog" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "userId" TEXT,
    "ticketId" TEXT,
    "adminUserId" TEXT,
    "direction" TEXT NOT NULL DEFAULT 'inbound',
    "durationSec" INTEGER,
    "outcome" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportCallLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminRefund" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'national',
    "reason" TEXT NOT NULL,
    "ledgerReference" TEXT NOT NULL,
    "originalRef" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminRefund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferUndo" (
    "id" TEXT NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'national',
    "operationType" TEXT NOT NULL DEFAULT 'send',
    "originalReference" TEXT NOT NULL,
    "recipientReference" TEXT NOT NULL,
    "reversibleUntil" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "reversedAt" TIMESTAMP(3),
    "reversedReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransferUndo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollGroup" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultPayAmount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollEmployee" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT,
    "jobTitle" TEXT,
    "payAmount" INTEGER,
    "paySchedule" TEXT NOT NULL DEFAULT 'manual',
    "payDayOfWeek" INTEGER,
    "payDayOfMonth" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollEmployee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollRun" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "reference" TEXT NOT NULL,
    "note" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayrollRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolStudent" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "parentUserId" TEXT NOT NULL,
    "gradeLabel" TEXT,
    "externalId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolStudent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolFeePeriod" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolFeePeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolFeePayment" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "parentUserId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paidAt" TIMESTAMP(3),
    "ledgerReference" TEXT,
    "reminderSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolFeePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmerDeliveryLog" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "farmerUserId" TEXT NOT NULL,
    "quantityTons" DOUBLE PRECISION NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "verifiedByUserId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "note" TEXT,
    "offlineClientId" TEXT,
    "payoutReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmerDeliveryLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBlock" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedUserId" TEXT,
    "blockedBusinessId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "targetBusinessId" TEXT,
    "category" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFriend" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "friendId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFriend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FriendRequest" (
    "id" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "FriendRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserVouch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserVouch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfflineSyncQueue" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfflineSyncQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPoll" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPoll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPollVote" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "optionIx" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPollVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Channel" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelPost" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "body" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChannelPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelFollow" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChannelFollow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentCode" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "locationLabel" TEXT,
    "arrondissement" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "tier" TEXT NOT NULL DEFAULT 'standard',
    "floatBalance" INTEGER NOT NULL DEFAULT 0,
    "floatLimit" INTEGER NOT NULL DEFAULT 500000,
    "maxDepositXof" INTEGER NOT NULL DEFAULT 500000,
    "maxWithdrawXof" INTEGER NOT NULL DEFAULT 500000,
    "commissionBps" INTEGER NOT NULL DEFAULT 100,
    "monthlyFlatFeeXof" INTEGER NOT NULL DEFAULT 25000,
    "volumeBonusBps" INTEGER NOT NULL DEFAULT 50,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentPayout" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "totalVolumeXof" INTEGER NOT NULL DEFAULT 0,
    "depositCount" INTEGER NOT NULL DEFAULT 0,
    "flatFeeXof" INTEGER NOT NULL DEFAULT 0,
    "volumeBonusXof" INTEGER NOT NULL DEFAULT 0,
    "totalPaidXof" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'paid',
    "reference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentDeposit" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentId" TEXT,
    "amountXof" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentDeposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentWithdrawal" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentId" TEXT,
    "amountXof" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentWithdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentFloatEntry" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amountXof" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "reference" TEXT NOT NULL,
    "depositId" TEXT,
    "withdrawalId" TEXT,
    "note" TEXT,
    "adminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentFloatEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeDeposit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountXof" INTEGER NOT NULL,
    "amountEurCents" INTEGER NOT NULL,
    "stripeSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "StripeDeposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "affiliateCode" TEXT NOT NULL,
    "displayName" TEXT,
    "commissionBps" INTEGER NOT NULL DEFAULT 500,
    "totalEarned" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateLink" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "productId" TEXT,
    "businessId" TEXT,
    "linkCode" TEXT NOT NULL,
    "label" TEXT,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateCommission" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "orderId" TEXT,
    "buyerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "orderTotal" INTEGER NOT NULL,
    "commissionBps" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "linkCode" TEXT,
    "productId" TEXT,
    "businessId" TEXT,
    "mboloThreadId" TEXT,
    "mboloMessageId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'paid',
    "reference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateCommission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NuLekkSplit" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "title" TEXT,
    "category" TEXT NOT NULL DEFAULT 'food',
    "totalKori" INTEGER NOT NULL,
    "businessId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "reference" TEXT NOT NULL,
    "fundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NuLekkSplit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NuLekkShare" (
    "id" TEXT NOT NULL,
    "splitId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountKori" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reference" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NuLekkShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KebuInvestmentOffering" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetKori" INTEGER NOT NULL,
    "raisedKori" INTEGER NOT NULL DEFAULT 0,
    "minInvestmentKori" INTEGER NOT NULL DEFAULT 1000,
    "maxInvestmentKori" INTEGER,
    "dividendBps" INTEGER NOT NULL DEFAULT 500,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KebuInvestmentOffering_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KebuInvestment" (
    "id" TEXT NOT NULL,
    "offeringId" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "amountKori" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "reference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KebuInvestment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KebuInvestmentPayout" (
    "id" TEXT NOT NULL,
    "investmentId" TEXT NOT NULL,
    "amountKori" INTEGER NOT NULL,
    "reference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KebuInvestmentPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KoriRedemptionOffer" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "costKori" INTEGER NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'reward',
    "inventory" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KoriRedemptionOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KoriRedemption" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "costKori" INTEGER NOT NULL,
    "reference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KoriRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_handle_key" ON "User"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "User_cniHash_key" ON "User"("cniHash");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_afriId_key" ON "User"("afriId");

-- CreateIndex
CREATE UNIQUE INDEX "User_inviteCode_key" ON "User"("inviteCode");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_afriId_idx" ON "User"("afriId");

-- CreateIndex
CREATE INDEX "User_afriClass_idx" ON "User"("afriClass");

-- CreateIndex
CREATE INDEX "User_frozenByAdminAt_idx" ON "User"("frozenByAdminAt");

-- CreateIndex
CREATE INDEX "User_verificationTier_idx" ON "User"("verificationTier");

-- CreateIndex
CREATE INDEX "User_handle_idx" ON "User"("handle");

-- CreateIndex
CREATE INDEX "User_inviteCode_idx" ON "User"("inviteCode");

-- CreateIndex
CREATE INDEX "User_referredByUserId_idx" ON "User"("referredByUserId");

-- CreateIndex
CREATE INDEX "AccountRole_role_idx" ON "AccountRole"("role");

-- CreateIndex
CREATE UNIQUE INDEX "AccountRole_userId_role_key" ON "AccountRole"("userId", "role");

-- CreateIndex
CREATE INDEX "OtpCode_phone_createdAt_idx" ON "OtpCode"("phone", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "KoriTransaction_reference_key" ON "KoriTransaction"("reference");

-- CreateIndex
CREATE INDEX "KoriTransaction_senderId_createdAt_idx" ON "KoriTransaction"("senderId", "createdAt");

-- CreateIndex
CREATE INDEX "KoriTransaction_recipientId_createdAt_idx" ON "KoriTransaction"("recipientId", "createdAt");

-- CreateIndex
CREATE INDEX "KoriTransaction_transactionType_idx" ON "KoriTransaction"("transactionType");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerEntry_reference_key" ON "LedgerEntry"("reference");

-- CreateIndex
CREATE INDEX "LedgerEntry_walletId_createdAt_idx" ON "LedgerEntry"("walletId", "createdAt");

-- CreateIndex
CREATE INDEX "LedgerEntry_userId_createdAt_idx" ON "LedgerEntry"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "LedgerEntry_type_idx" ON "LedgerEntry"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Business_kebuId_key" ON "Business"("kebuId");

-- CreateIndex
CREATE INDEX "Business_ownerId_idx" ON "Business"("ownerId");

-- CreateIndex
CREATE INDEX "Business_category_idx" ON "Business"("category");

-- CreateIndex
CREATE INDEX "Business_type_idx" ON "Business"("type");

-- CreateIndex
CREATE INDEX "BusinessMember_userId_idx" ON "BusinessMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessMember_businessId_userId_role_key" ON "BusinessMember"("businessId", "userId", "role");

-- CreateIndex
CREATE INDEX "BusinessCommunityStatus_businessId_expiresAt_idx" ON "BusinessCommunityStatus"("businessId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessCommunityStatus_businessId_userId_key" ON "BusinessCommunityStatus"("businessId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessWallet_businessId_key" ON "BusinessWallet"("businessId");

-- CreateIndex
CREATE INDEX "BusinessWallet_businessId_idx" ON "BusinessWallet"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessLedgerEntry_reference_key" ON "BusinessLedgerEntry"("reference");

-- CreateIndex
CREATE INDEX "BusinessLedgerEntry_businessWalletId_createdAt_idx" ON "BusinessLedgerEntry"("businessWalletId", "createdAt");

-- CreateIndex
CREATE INDEX "BusinessLedgerEntry_businessId_createdAt_idx" ON "BusinessLedgerEntry"("businessId", "createdAt");

-- CreateIndex
CREATE INDEX "BusinessLedgerEntry_type_idx" ON "BusinessLedgerEntry"("type");

-- CreateIndex
CREATE UNIQUE INDEX "SellerProfile_userId_key" ON "SellerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DriverProfile_userId_key" ON "DriverProfile"("userId");

-- CreateIndex
CREATE INDEX "DriverProfile_status_lastActiveAt_idx" ON "DriverProfile"("status", "lastActiveAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerProfile_userId_key" ON "WorkerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerProfile_workerId_key" ON "WorkerProfile"("workerId");

-- CreateIndex
CREATE INDEX "WorkerProfile_workerId_idx" ON "WorkerProfile"("workerId");

-- CreateIndex
CREATE INDEX "WorkerProfile_status_idx" ON "WorkerProfile"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerReceipt_reference_key" ON "WorkerReceipt"("reference");

-- CreateIndex
CREATE INDEX "WorkerReceipt_workerProfileId_completedAt_idx" ON "WorkerReceipt"("workerProfileId", "completedAt");

-- CreateIndex
CREATE INDEX "WorkerReceipt_userId_idx" ON "WorkerReceipt"("userId");

-- CreateIndex
CREATE INDEX "WorkerReceipt_kind_idx" ON "WorkerReceipt"("kind");

-- CreateIndex
CREATE INDEX "Product_sellerId_idx" ON "Product"("sellerId");

-- CreateIndex
CREATE INDEX "Product_businessId_idx" ON "Product"("businessId");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderReference_key" ON "Order"("orderReference");

-- CreateIndex
CREATE INDEX "Order_buyerId_idx" ON "Order"("buyerId");

-- CreateIndex
CREATE INDEX "Order_businessId_idx" ON "Order"("businessId");

-- CreateIndex
CREATE INDEX "Order_buyerBusinessId_idx" ON "Order"("buyerBusinessId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");

-- CreateIndex
CREATE INDEX "Order_preferredDeliveryDate_idx" ON "Order"("preferredDeliveryDate");

-- CreateIndex
CREATE INDEX "Order_hubId_idx" ON "Order"("hubId");

-- CreateIndex
CREATE INDEX "Order_promoId_idx" ON "Order"("promoId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryHub_code_key" ON "DeliveryHub"("code");

-- CreateIndex
CREATE INDEX "DeliveryHub_active_idx" ON "DeliveryHub"("active");

-- CreateIndex
CREATE INDEX "DeliveryHub_country_city_idx" ON "DeliveryHub"("country", "city");

-- CreateIndex
CREATE UNIQUE INDEX "HubParcel_reference_key" ON "HubParcel"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "HubParcel_lastMileOrderId_key" ON "HubParcel"("lastMileOrderId");

-- CreateIndex
CREATE INDEX "HubParcel_ownerId_status_idx" ON "HubParcel"("ownerId", "status");

-- CreateIndex
CREATE INDEX "HubParcel_hubId_status_idx" ON "HubParcel"("hubId", "status");

-- CreateIndex
CREATE INDEX "HubParcel_status_idx" ON "HubParcel"("status");

-- CreateIndex
CREATE INDEX "HubParcel_pickupCode_idx" ON "HubParcel"("pickupCode");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE INDEX "OrderItem_promoId_idx" ON "OrderItem"("promoId");

-- CreateIndex
CREATE INDEX "TradeAccount_buyerUserId_idx" ON "TradeAccount"("buyerUserId");

-- CreateIndex
CREATE INDEX "TradeAccount_supplierBusinessId_active_idx" ON "TradeAccount"("supplierBusinessId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "TradeAccount_supplierBusinessId_buyerUserId_key" ON "TradeAccount"("supplierBusinessId", "buyerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "TradeInvoice_orderId_key" ON "TradeInvoice"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "TradeInvoice_reference_key" ON "TradeInvoice"("reference");

-- CreateIndex
CREATE INDEX "TradeInvoice_buyerUserId_status_idx" ON "TradeInvoice"("buyerUserId", "status");

-- CreateIndex
CREATE INDEX "TradeInvoice_supplierBusinessId_status_idx" ON "TradeInvoice"("supplierBusinessId", "status");

-- CreateIndex
CREATE INDEX "TradeInvoice_dueAt_idx" ON "TradeInvoice"("dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryTask_orderId_key" ON "DeliveryTask"("orderId");

-- CreateIndex
CREATE INDEX "DeliveryTask_assignedDriverId_idx" ON "DeliveryTask"("assignedDriverId");

-- CreateIndex
CREATE INDEX "DeliveryTask_status_idx" ON "DeliveryTask"("status");

-- CreateIndex
CREATE INDEX "DeliveryTask_buyerId_idx" ON "DeliveryTask"("buyerId");

-- CreateIndex
CREATE INDEX "DeliveryTask_autoReleaseAt_idx" ON "DeliveryTask"("autoReleaseAt");

-- CreateIndex
CREATE INDEX "DeliveryTask_hubId_idx" ON "DeliveryTask"("hubId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryEscrow_deliveryTaskId_key" ON "DeliveryEscrow"("deliveryTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryEscrow_reference_key" ON "DeliveryEscrow"("reference");

-- CreateIndex
CREATE INDEX "DeliveryEscrow_buyerId_idx" ON "DeliveryEscrow"("buyerId");

-- CreateIndex
CREATE INDEX "DeliveryEscrow_riderId_idx" ON "DeliveryEscrow"("riderId");

-- CreateIndex
CREATE INDEX "DeliveryEscrow_status_idx" ON "DeliveryEscrow"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryDispute_deliveryTaskId_key" ON "DeliveryDispute"("deliveryTaskId");

-- CreateIndex
CREATE INDEX "DeliveryDispute_status_idx" ON "DeliveryDispute"("status");

-- CreateIndex
CREATE INDEX "DeliveryDispute_holdUntil_idx" ON "DeliveryDispute"("holdUntil");

-- CreateIndex
CREATE INDEX "DeliveryDisputeEvidence_disputeId_idx" ON "DeliveryDisputeEvidence"("disputeId");

-- CreateIndex
CREATE INDEX "DeliveryDisputeEvidence_userId_idx" ON "DeliveryDisputeEvidence"("userId");

-- CreateIndex
CREATE INDEX "Event_promoterId_idx" ON "Event"("promoterId");

-- CreateIndex
CREATE INDEX "Event_startsAt_idx" ON "Event"("startsAt");

-- CreateIndex
CREATE INDEX "Ticket_eventId_idx" ON "Ticket"("eventId");

-- CreateIndex
CREATE INDEX "Ticket_buyerId_idx" ON "Ticket"("buyerId");

-- CreateIndex
CREATE UNIQUE INDEX "TicketPass_scanCode_key" ON "TicketPass"("scanCode");

-- CreateIndex
CREATE INDEX "TicketPass_ticketId_idx" ON "TicketPass"("ticketId");

-- CreateIndex
CREATE INDEX "TicketPass_status_idx" ON "TicketPass"("status");

-- CreateIndex
CREATE INDEX "SolidarityCampaign_creatorId_idx" ON "SolidarityCampaign"("creatorId");

-- CreateIndex
CREATE INDEX "SolidarityCampaign_beneficiaryUserId_idx" ON "SolidarityCampaign"("beneficiaryUserId");

-- CreateIndex
CREATE INDEX "SolidarityCampaign_status_createdAt_idx" ON "SolidarityCampaign"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SolidarityCampaign_kind_status_idx" ON "SolidarityCampaign"("kind", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SolidarityContribution_reference_key" ON "SolidarityContribution"("reference");

-- CreateIndex
CREATE INDEX "SolidarityContribution_campaignId_createdAt_idx" ON "SolidarityContribution"("campaignId", "createdAt");

-- CreateIndex
CREATE INDEX "SolidarityContribution_donorId_idx" ON "SolidarityContribution"("donorId");

-- CreateIndex
CREATE INDEX "MboloThread_creatorId_idx" ON "MboloThread"("creatorId");

-- CreateIndex
CREATE INDEX "MboloThread_type_idx" ON "MboloThread"("type");

-- CreateIndex
CREATE INDEX "MboloMember_userId_idx" ON "MboloMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MboloMember_threadId_userId_key" ON "MboloMember"("threadId", "userId");

-- CreateIndex
CREATE INDEX "MboloMessage_threadId_createdAt_idx" ON "MboloMessage"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "MboloMessage_senderId_idx" ON "MboloMessage"("senderId");

-- CreateIndex
CREATE INDEX "TontineGroup_createdBy_idx" ON "TontineGroup"("createdBy");

-- CreateIndex
CREATE INDEX "TontineGroup_active_nextDueAt_idx" ON "TontineGroup"("active", "nextDueAt");

-- CreateIndex
CREATE INDEX "TontineMembership_userId_idx" ON "TontineMembership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TontineMembership_groupId_userId_key" ON "TontineMembership"("groupId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TontineContribution_reference_key" ON "TontineContribution"("reference");

-- CreateIndex
CREATE INDEX "TontineContribution_groupId_cycleKey_idx" ON "TontineContribution"("groupId", "cycleKey");

-- CreateIndex
CREATE UNIQUE INDEX "TontineContribution_groupId_userId_cycleKey_key" ON "TontineContribution"("groupId", "userId", "cycleKey");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_kind_refId_idx" ON "Notification"("userId", "kind", "refId");

-- CreateIndex
CREATE INDEX "RegionalAlert_country_publishedAt_idx" ON "RegionalAlert"("country", "publishedAt");

-- CreateIndex
CREATE INDEX "RegionalAlert_validUntil_idx" ON "RegionalAlert"("validUntil");

-- CreateIndex
CREATE INDEX "AlertRead_alertId_idx" ON "AlertRead"("alertId");

-- CreateIndex
CREATE UNIQUE INDEX "AlertRead_userId_alertId_key" ON "AlertRead"("userId", "alertId");

-- CreateIndex
CREATE INDEX "TrendingArticle_country_category_publishedAt_idx" ON "TrendingArticle"("country", "category", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MoneyRequest_reference_key" ON "MoneyRequest"("reference");

-- CreateIndex
CREATE INDEX "MoneyRequest_requesterId_status_createdAt_idx" ON "MoneyRequest"("requesterId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "MoneyRequest_payerId_status_createdAt_idx" ON "MoneyRequest"("payerId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "MerchantVoucher_userId_idx" ON "MerchantVoucher"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantVoucher_userId_businessId_key" ON "MerchantVoucher"("userId", "businessId");

-- CreateIndex
CREATE INDEX "MerchantPromo_businessId_active_idx" ON "MerchantPromo"("businessId", "active");

-- CreateIndex
CREATE INDEX "MerchantPromo_active_expiresAt_idx" ON "MerchantPromo"("active", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantPromo_businessId_code_key" ON "MerchantPromo"("businessId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantPromoUse_reference_key" ON "MerchantPromoUse"("reference");

-- CreateIndex
CREATE INDEX "MerchantPromoUse_promoId_userId_idx" ON "MerchantPromoUse"("promoId", "userId");

-- CreateIndex
CREATE INDEX "MerchantPromoUse_userId_createdAt_idx" ON "MerchantPromoUse"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "MerchantPromoUse_orderId_idx" ON "MerchantPromoUse"("orderId");

-- CreateIndex
CREATE INDEX "ProductView_productId_createdAt_idx" ON "ProductView"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "ProductView_businessId_createdAt_idx" ON "ProductView"("businessId", "createdAt");

-- CreateIndex
CREATE INDEX "ProductView_userId_idx" ON "ProductView"("userId");

-- CreateIndex
CREATE INDEX "PaymentFund_userId_idx" ON "PaymentFund"("userId");

-- CreateIndex
CREATE INDEX "ScheduledPayment_userId_active_idx" ON "ScheduledPayment"("userId", "active");

-- CreateIndex
CREATE INDEX "ScheduledPayment_nextRunAt_active_idx" ON "ScheduledPayment"("nextRunAt", "active");

-- CreateIndex
CREATE UNIQUE INDEX "RailTransaction_reference_key" ON "RailTransaction"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "RailTransaction_idempotencyKey_key" ON "RailTransaction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "RailTransaction_userId_createdAt_idx" ON "RailTransaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "RailTransaction_provider_externalId_idx" ON "RailTransaction"("provider", "externalId");

-- CreateIndex
CREATE INDEX "RailTransaction_status_idx" ON "RailTransaction"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ApiIdempotency_key_key" ON "ApiIdempotency"("key");

-- CreateIndex
CREATE INDEX "ApiIdempotency_userId_provider_idx" ON "ApiIdempotency"("userId", "provider");

-- CreateIndex
CREATE INDEX "ApiIdempotency_reference_idx" ON "ApiIdempotency"("reference");

-- CreateIndex
CREATE INDEX "ApiAuditLog_userId_createdAt_idx" ON "ApiAuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ApiAuditLog_createdAt_idx" ON "ApiAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "UserDevice_userId_lastSeenAt_idx" ON "UserDevice"("userId", "lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserDevice_userId_deviceId_key" ON "UserDevice"("userId", "deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "HeldTransaction_reference_key" ON "HeldTransaction"("reference");

-- CreateIndex
CREATE INDEX "HeldTransaction_userId_status_idx" ON "HeldTransaction"("userId", "status");

-- CreateIndex
CREATE INDEX "HeldTransaction_status_createdAt_idx" ON "HeldTransaction"("status", "createdAt");

-- CreateIndex
CREATE INDEX "HeldTransaction_expiresAt_idx" ON "HeldTransaction"("expiresAt");

-- CreateIndex
CREATE INDEX "FraudAlert_userId_createdAt_idx" ON "FraudAlert"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "FraudAlert_heldTransactionId_idx" ON "FraudAlert"("heldTransactionId");

-- CreateIndex
CREATE INDEX "FraudAlert_acknowledgedAt_idx" ON "FraudAlert"("acknowledgedAt");

-- CreateIndex
CREATE INDEX "CniVerificationJob_userId_status_idx" ON "CniVerificationJob"("userId", "status");

-- CreateIndex
CREATE INDEX "CniVerificationJob_externalJobId_idx" ON "CniVerificationJob"("externalJobId");

-- CreateIndex
CREATE INDEX "CniVerificationJob_purgeImagesAt_idx" ON "CniVerificationJob"("purgeImagesAt");

-- CreateIndex
CREATE INDEX "SmsMessage_phone_createdAt_idx" ON "SmsMessage"("phone", "createdAt");

-- CreateIndex
CREATE INDEX "SmsMessage_userId_createdAt_idx" ON "SmsMessage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SmsMessage_purpose_createdAt_idx" ON "SmsMessage"("purpose", "createdAt");

-- CreateIndex
CREATE INDEX "SecureLog_category_createdAt_idx" ON "SecureLog"("category", "createdAt");

-- CreateIndex
CREATE INDEX "SecureLog_severity_createdAt_idx" ON "SecureLog"("severity", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "AdminUser_active_idx" ON "AdminUser"("active");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSession_tokenHash_key" ON "AdminSession"("tokenHash");

-- CreateIndex
CREATE INDEX "AdminSession_adminUserId_idx" ON "AdminSession"("adminUserId");

-- CreateIndex
CREATE INDEX "AdminSession_expiresAt_idx" ON "AdminSession"("expiresAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_adminUserId_createdAt_idx" ON "AdminAuditLog"("adminUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_action_createdAt_idx" ON "AdminAuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "SupportTicket_userId_status_idx" ON "SupportTicket"("userId", "status");

-- CreateIndex
CREATE INDEX "SupportTicket_status_createdAt_idx" ON "SupportTicket"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SupportTicket_channel_createdAt_idx" ON "SupportTicket"("channel", "createdAt");

-- CreateIndex
CREATE INDEX "SupportTicket_assignedAdminId_idx" ON "SupportTicket"("assignedAdminId");

-- CreateIndex
CREATE INDEX "SupportTicketMessage_ticketId_createdAt_idx" ON "SupportTicketMessage"("ticketId", "createdAt");

-- CreateIndex
CREATE INDEX "SupportCallLog_createdAt_idx" ON "SupportCallLog"("createdAt");

-- CreateIndex
CREATE INDEX "SupportCallLog_phone_idx" ON "SupportCallLog"("phone");

-- CreateIndex
CREATE INDEX "SupportCallLog_userId_idx" ON "SupportCallLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminRefund_ledgerReference_key" ON "AdminRefund"("ledgerReference");

-- CreateIndex
CREATE INDEX "AdminRefund_recipientUserId_createdAt_idx" ON "AdminRefund"("recipientUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminRefund_adminUserId_createdAt_idx" ON "AdminRefund"("adminUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TransferUndo_originalReference_key" ON "TransferUndo"("originalReference");

-- CreateIndex
CREATE UNIQUE INDEX "TransferUndo_reversedReference_key" ON "TransferUndo"("reversedReference");

-- CreateIndex
CREATE INDEX "TransferUndo_senderUserId_status_idx" ON "TransferUndo"("senderUserId", "status");

-- CreateIndex
CREATE INDEX "TransferUndo_recipientUserId_idx" ON "TransferUndo"("recipientUserId");

-- CreateIndex
CREATE INDEX "TransferUndo_reversibleUntil_idx" ON "TransferUndo"("reversibleUntil");

-- CreateIndex
CREATE INDEX "PayrollGroup_businessId_idx" ON "PayrollGroup"("businessId");

-- CreateIndex
CREATE INDEX "PayrollEmployee_businessId_status_idx" ON "PayrollEmployee"("businessId", "status");

-- CreateIndex
CREATE INDEX "PayrollEmployee_userId_idx" ON "PayrollEmployee"("userId");

-- CreateIndex
CREATE INDEX "PayrollEmployee_groupId_idx" ON "PayrollEmployee"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollEmployee_businessId_userId_key" ON "PayrollEmployee"("businessId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollRun_reference_key" ON "PayrollRun"("reference");

-- CreateIndex
CREATE INDEX "PayrollRun_businessId_createdAt_idx" ON "PayrollRun"("businessId", "createdAt");

-- CreateIndex
CREATE INDEX "PayrollRun_employeeId_createdAt_idx" ON "PayrollRun"("employeeId", "createdAt");

-- CreateIndex
CREATE INDEX "SchoolStudent_businessId_status_idx" ON "SchoolStudent"("businessId", "status");

-- CreateIndex
CREATE INDEX "SchoolStudent_parentUserId_idx" ON "SchoolStudent"("parentUserId");

-- CreateIndex
CREATE INDEX "SchoolFeePeriod_businessId_status_idx" ON "SchoolFeePeriod"("businessId", "status");

-- CreateIndex
CREATE INDEX "SchoolFeePeriod_dueDate_idx" ON "SchoolFeePeriod"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolFeePayment_ledgerReference_key" ON "SchoolFeePayment"("ledgerReference");

-- CreateIndex
CREATE INDEX "SchoolFeePayment_parentUserId_status_idx" ON "SchoolFeePayment"("parentUserId", "status");

-- CreateIndex
CREATE INDEX "SchoolFeePayment_periodId_status_idx" ON "SchoolFeePayment"("periodId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolFeePayment_periodId_studentId_key" ON "SchoolFeePayment"("periodId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "FarmerDeliveryLog_offlineClientId_key" ON "FarmerDeliveryLog"("offlineClientId");

-- CreateIndex
CREATE UNIQUE INDEX "FarmerDeliveryLog_payoutReference_key" ON "FarmerDeliveryLog"("payoutReference");

-- CreateIndex
CREATE INDEX "FarmerDeliveryLog_businessId_status_idx" ON "FarmerDeliveryLog"("businessId", "status");

-- CreateIndex
CREATE INDEX "FarmerDeliveryLog_farmerUserId_createdAt_idx" ON "FarmerDeliveryLog"("farmerUserId", "createdAt");

-- CreateIndex
CREATE INDEX "UserBlock_blockerId_idx" ON "UserBlock"("blockerId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBlock_blockerId_blockedUserId_key" ON "UserBlock"("blockerId", "blockedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBlock_blockerId_blockedBusinessId_key" ON "UserBlock"("blockerId", "blockedBusinessId");

-- CreateIndex
CREATE INDEX "ContentReport_status_createdAt_idx" ON "ContentReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ContentReport_reporterId_idx" ON "ContentReport"("reporterId");

-- CreateIndex
CREATE INDEX "ContentReport_targetUserId_idx" ON "ContentReport"("targetUserId");

-- CreateIndex
CREATE INDEX "ContentReport_targetBusinessId_idx" ON "ContentReport"("targetBusinessId");

-- CreateIndex
CREATE INDEX "UserFriend_userId_idx" ON "UserFriend"("userId");

-- CreateIndex
CREATE INDEX "UserFriend_friendId_idx" ON "UserFriend"("friendId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFriend_userId_friendId_key" ON "UserFriend"("userId", "friendId");

-- CreateIndex
CREATE INDEX "FriendRequest_toId_status_idx" ON "FriendRequest"("toId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FriendRequest_fromId_toId_key" ON "FriendRequest"("fromId", "toId");

-- CreateIndex
CREATE INDEX "UserVouch_userId_idx" ON "UserVouch"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserVouch_userId_voucherId_key" ON "UserVouch"("userId", "voucherId");

-- CreateIndex
CREATE UNIQUE INDEX "OfflineSyncQueue_clientId_key" ON "OfflineSyncQueue"("clientId");

-- CreateIndex
CREATE INDEX "OfflineSyncQueue_userId_syncedAt_idx" ON "OfflineSyncQueue"("userId", "syncedAt");

-- CreateIndex
CREATE INDEX "OfflineSyncQueue_entityType_idx" ON "OfflineSyncQueue"("entityType");

-- CreateIndex
CREATE INDEX "Review_businessId_idx" ON "Review"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_businessId_userId_key" ON "Review"("businessId", "userId");

-- CreateIndex
CREATE INDEX "UserPoll_userId_active_idx" ON "UserPoll"("userId", "active");

-- CreateIndex
CREATE INDEX "UserPollVote_pollId_idx" ON "UserPollVote"("pollId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPollVote_pollId_userId_key" ON "UserPollVote"("pollId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Channel_ownerId_key" ON "Channel"("ownerId");

-- CreateIndex
CREATE INDEX "ChannelPost_channelId_createdAt_idx" ON "ChannelPost"("channelId", "createdAt");

-- CreateIndex
CREATE INDEX "ChannelFollow_userId_idx" ON "ChannelFollow"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelFollow_channelId_userId_key" ON "ChannelFollow"("channelId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentProfile_userId_key" ON "AgentProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentProfile_agentCode_key" ON "AgentProfile"("agentCode");

-- CreateIndex
CREATE INDEX "AgentProfile_status_idx" ON "AgentProfile"("status");

-- CreateIndex
CREATE INDEX "AgentProfile_tier_idx" ON "AgentProfile"("tier");

-- CreateIndex
CREATE INDEX "AgentProfile_lat_lng_idx" ON "AgentProfile"("lat", "lng");

-- CreateIndex
CREATE UNIQUE INDEX "AgentPayout_reference_key" ON "AgentPayout"("reference");

-- CreateIndex
CREATE INDEX "AgentPayout_periodYear_periodMonth_idx" ON "AgentPayout"("periodYear", "periodMonth");

-- CreateIndex
CREATE UNIQUE INDEX "AgentPayout_agentId_periodYear_periodMonth_key" ON "AgentPayout"("agentId", "periodYear", "periodMonth");

-- CreateIndex
CREATE UNIQUE INDEX "AgentDeposit_reference_key" ON "AgentDeposit"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "AgentDeposit_token_key" ON "AgentDeposit"("token");

-- CreateIndex
CREATE INDEX "AgentDeposit_userId_createdAt_idx" ON "AgentDeposit"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AgentDeposit_agentId_createdAt_idx" ON "AgentDeposit"("agentId", "createdAt");

-- CreateIndex
CREATE INDEX "AgentDeposit_status_expiresAt_idx" ON "AgentDeposit"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "AgentWithdrawal_reference_key" ON "AgentWithdrawal"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "AgentWithdrawal_token_key" ON "AgentWithdrawal"("token");

-- CreateIndex
CREATE INDEX "AgentWithdrawal_userId_createdAt_idx" ON "AgentWithdrawal"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AgentWithdrawal_agentId_createdAt_idx" ON "AgentWithdrawal"("agentId", "createdAt");

-- CreateIndex
CREATE INDEX "AgentWithdrawal_status_expiresAt_idx" ON "AgentWithdrawal"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "AgentFloatEntry_reference_key" ON "AgentFloatEntry"("reference");

-- CreateIndex
CREATE INDEX "AgentFloatEntry_agentId_createdAt_idx" ON "AgentFloatEntry"("agentId", "createdAt");

-- CreateIndex
CREATE INDEX "AgentFloatEntry_type_idx" ON "AgentFloatEntry"("type");

-- CreateIndex
CREATE UNIQUE INDEX "StripeDeposit_stripeSessionId_key" ON "StripeDeposit"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "StripeDeposit_stripePaymentIntentId_key" ON "StripeDeposit"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "StripeDeposit_reference_key" ON "StripeDeposit"("reference");

-- CreateIndex
CREATE INDEX "StripeDeposit_userId_createdAt_idx" ON "StripeDeposit"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "StripeDeposit_status_idx" ON "StripeDeposit"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateProfile_userId_key" ON "AffiliateProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateProfile_affiliateCode_key" ON "AffiliateProfile"("affiliateCode");

-- CreateIndex
CREATE INDEX "AffiliateProfile_status_idx" ON "AffiliateProfile"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateLink_linkCode_key" ON "AffiliateLink"("linkCode");

-- CreateIndex
CREATE INDEX "AffiliateLink_affiliateId_idx" ON "AffiliateLink"("affiliateId");

-- CreateIndex
CREATE INDEX "AffiliateLink_businessId_idx" ON "AffiliateLink"("businessId");

-- CreateIndex
CREATE INDEX "AffiliateLink_productId_idx" ON "AffiliateLink"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateCommission_reference_key" ON "AffiliateCommission"("reference");

-- CreateIndex
CREATE INDEX "AffiliateCommission_affiliateId_createdAt_idx" ON "AffiliateCommission"("affiliateId", "createdAt");

-- CreateIndex
CREATE INDEX "AffiliateCommission_buyerId_idx" ON "AffiliateCommission"("buyerId");

-- CreateIndex
CREATE INDEX "AffiliateCommission_orderId_idx" ON "AffiliateCommission"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "NuLekkSplit_reference_key" ON "NuLekkSplit"("reference");

-- CreateIndex
CREATE INDEX "NuLekkSplit_creatorId_status_createdAt_idx" ON "NuLekkSplit"("creatorId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "NuLekkSplit_businessId_idx" ON "NuLekkSplit"("businessId");

-- CreateIndex
CREATE INDEX "NuLekkSplit_status_idx" ON "NuLekkSplit"("status");

-- CreateIndex
CREATE UNIQUE INDEX "NuLekkShare_reference_key" ON "NuLekkShare"("reference");

-- CreateIndex
CREATE INDEX "NuLekkShare_userId_status_idx" ON "NuLekkShare"("userId", "status");

-- CreateIndex
CREATE INDEX "NuLekkShare_splitId_status_idx" ON "NuLekkShare"("splitId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "NuLekkShare_splitId_userId_key" ON "NuLekkShare"("splitId", "userId");

-- CreateIndex
CREATE INDEX "KebuInvestmentOffering_businessId_status_idx" ON "KebuInvestmentOffering"("businessId", "status");

-- CreateIndex
CREATE INDEX "KebuInvestmentOffering_status_createdAt_idx" ON "KebuInvestmentOffering"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "KebuInvestment_reference_key" ON "KebuInvestment"("reference");

-- CreateIndex
CREATE INDEX "KebuInvestment_investorId_status_idx" ON "KebuInvestment"("investorId", "status");

-- CreateIndex
CREATE INDEX "KebuInvestment_offeringId_idx" ON "KebuInvestment"("offeringId");

-- CreateIndex
CREATE UNIQUE INDEX "KebuInvestmentPayout_reference_key" ON "KebuInvestmentPayout"("reference");

-- CreateIndex
CREATE INDEX "KebuInvestmentPayout_investmentId_idx" ON "KebuInvestmentPayout"("investmentId");

-- CreateIndex
CREATE INDEX "KoriRedemptionOffer_businessId_active_idx" ON "KoriRedemptionOffer"("businessId", "active");

-- CreateIndex
CREATE INDEX "KoriRedemptionOffer_active_costKori_idx" ON "KoriRedemptionOffer"("active", "costKori");

-- CreateIndex
CREATE UNIQUE INDEX "KoriRedemption_reference_key" ON "KoriRedemption"("reference");

-- CreateIndex
CREATE INDEX "KoriRedemption_userId_createdAt_idx" ON "KoriRedemption"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "KoriRedemption_offerId_idx" ON "KoriRedemption"("offerId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_studentPassBusinessId_fkey" FOREIGN KEY ("studentPassBusinessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referredByUserId_fkey" FOREIGN KEY ("referredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountRole" ADD CONSTRAINT "AccountRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KoriTransaction" ADD CONSTRAINT "KoriTransaction_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KoriTransaction" ADD CONSTRAINT "KoriTransaction_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessMember" ADD CONSTRAINT "BusinessMember_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessMember" ADD CONSTRAINT "BusinessMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessCommunityStatus" ADD CONSTRAINT "BusinessCommunityStatus_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessCommunityStatus" ADD CONSTRAINT "BusinessCommunityStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessWallet" ADD CONSTRAINT "BusinessWallet_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessLedgerEntry" ADD CONSTRAINT "BusinessLedgerEntry_businessWalletId_fkey" FOREIGN KEY ("businessWalletId") REFERENCES "BusinessWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessLedgerEntry" ADD CONSTRAINT "BusinessLedgerEntry_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessLedgerEntry" ADD CONSTRAINT "BusinessLedgerEntry_counterpartyBusinessId_fkey" FOREIGN KEY ("counterpartyBusinessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessLedgerEntry" ADD CONSTRAINT "BusinessLedgerEntry_counterpartyUserId_fkey" FOREIGN KEY ("counterpartyUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerProfile" ADD CONSTRAINT "SellerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverProfile" ADD CONSTRAINT "DriverProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerProfile" ADD CONSTRAINT "WorkerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerReceipt" ADD CONSTRAINT "WorkerReceipt_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "SellerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_buyerBusinessId_fkey" FOREIGN KEY ("buyerBusinessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "DeliveryHub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_promoId_fkey" FOREIGN KEY ("promoId") REFERENCES "MerchantPromo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubParcel" ADD CONSTRAINT "HubParcel_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubParcel" ADD CONSTRAINT "HubParcel_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "DeliveryHub"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubParcel" ADD CONSTRAINT "HubParcel_lastMileOrderId_fkey" FOREIGN KEY ("lastMileOrderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_promoId_fkey" FOREIGN KEY ("promoId") REFERENCES "MerchantPromo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeAccount" ADD CONSTRAINT "TradeAccount_supplierBusinessId_fkey" FOREIGN KEY ("supplierBusinessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeAccount" ADD CONSTRAINT "TradeAccount_buyerUserId_fkey" FOREIGN KEY ("buyerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeAccount" ADD CONSTRAINT "TradeAccount_buyerBusinessId_fkey" FOREIGN KEY ("buyerBusinessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeInvoice" ADD CONSTRAINT "TradeInvoice_supplierBusinessId_fkey" FOREIGN KEY ("supplierBusinessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeInvoice" ADD CONSTRAINT "TradeInvoice_buyerUserId_fkey" FOREIGN KEY ("buyerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeInvoice" ADD CONSTRAINT "TradeInvoice_buyerBusinessId_fkey" FOREIGN KEY ("buyerBusinessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeInvoice" ADD CONSTRAINT "TradeInvoice_tradeAccountId_fkey" FOREIGN KEY ("tradeAccountId") REFERENCES "TradeAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeInvoice" ADD CONSTRAINT "TradeInvoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryTask" ADD CONSTRAINT "DeliveryTask_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryTask" ADD CONSTRAINT "DeliveryTask_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "DeliveryHub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryTask" ADD CONSTRAINT "DeliveryTask_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryTask" ADD CONSTRAINT "DeliveryTask_assignedDriverId_fkey" FOREIGN KEY ("assignedDriverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryEscrow" ADD CONSTRAINT "DeliveryEscrow_deliveryTaskId_fkey" FOREIGN KEY ("deliveryTaskId") REFERENCES "DeliveryTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryDispute" ADD CONSTRAINT "DeliveryDispute_deliveryTaskId_fkey" FOREIGN KEY ("deliveryTaskId") REFERENCES "DeliveryTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryDisputeEvidence" ADD CONSTRAINT "DeliveryDisputeEvidence_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "DeliveryDispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_promoterId_fkey" FOREIGN KEY ("promoterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketPass" ADD CONSTRAINT "TicketPass_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolidarityCampaign" ADD CONSTRAINT "SolidarityCampaign_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolidarityCampaign" ADD CONSTRAINT "SolidarityCampaign_beneficiaryUserId_fkey" FOREIGN KEY ("beneficiaryUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolidarityContribution" ADD CONSTRAINT "SolidarityContribution_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "SolidarityCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolidarityContribution" ADD CONSTRAINT "SolidarityContribution_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MboloThread" ADD CONSTRAINT "MboloThread_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MboloMember" ADD CONSTRAINT "MboloMember_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "MboloThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MboloMember" ADD CONSTRAINT "MboloMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MboloMessage" ADD CONSTRAINT "MboloMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "MboloThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MboloMessage" ADD CONSTRAINT "MboloMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TontineGroup" ADD CONSTRAINT "TontineGroup_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TontineMembership" ADD CONSTRAINT "TontineMembership_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "TontineGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TontineMembership" ADD CONSTRAINT "TontineMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TontineContribution" ADD CONSTRAINT "TontineContribution_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "TontineGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TontineContribution" ADD CONSTRAINT "TontineContribution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertRead" ADD CONSTRAINT "AlertRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertRead" ADD CONSTRAINT "AlertRead_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "RegionalAlert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoneyRequest" ADD CONSTRAINT "MoneyRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoneyRequest" ADD CONSTRAINT "MoneyRequest_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoneyRequest" ADD CONSTRAINT "MoneyRequest_lockToBusinessId_fkey" FOREIGN KEY ("lockToBusinessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantVoucher" ADD CONSTRAINT "MerchantVoucher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantVoucher" ADD CONSTRAINT "MerchantVoucher_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantPromo" ADD CONSTRAINT "MerchantPromo_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantPromo" ADD CONSTRAINT "MerchantPromo_triggerProductId_fkey" FOREIGN KEY ("triggerProductId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantPromo" ADD CONSTRAINT "MerchantPromo_freeProductId_fkey" FOREIGN KEY ("freeProductId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantPromoUse" ADD CONSTRAINT "MerchantPromoUse_promoId_fkey" FOREIGN KEY ("promoId") REFERENCES "MerchantPromo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantPromoUse" ADD CONSTRAINT "MerchantPromoUse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantPromoUse" ADD CONSTRAINT "MerchantPromoUse_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductView" ADD CONSTRAINT "ProductView_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductView" ADD CONSTRAINT "ProductView_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductView" ADD CONSTRAINT "ProductView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentFund" ADD CONSTRAINT "PaymentFund_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledPayment" ADD CONSTRAINT "ScheduledPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledPayment" ADD CONSTRAINT "ScheduledPayment_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "PaymentFund"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RailTransaction" ADD CONSTRAINT "RailTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiIdempotency" ADD CONSTRAINT "ApiIdempotency_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiAuditLog" ADD CONSTRAINT "ApiAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRateLimit" ADD CONSTRAINT "UserRateLimit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDevice" ADD CONSTRAINT "UserDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeldTransaction" ADD CONSTRAINT "HeldTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudAlert" ADD CONSTRAINT "FraudAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudAlert" ADD CONSTRAINT "FraudAlert_heldTransactionId_fkey" FOREIGN KEY ("heldTransactionId") REFERENCES "HeldTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CniVerificationJob" ADD CONSTRAINT "CniVerificationJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDailyUsage" ADD CONSTRAINT "UserDailyUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmsMessage" ADD CONSTRAINT "SmsMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_assignedAdminId_fkey" FOREIGN KEY ("assignedAdminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicketMessage" ADD CONSTRAINT "SupportTicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicketMessage" ADD CONSTRAINT "SupportTicketMessage_authorAdminId_fkey" FOREIGN KEY ("authorAdminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicketMessage" ADD CONSTRAINT "SupportTicketMessage_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportCallLog" ADD CONSTRAINT "SupportCallLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportCallLog" ADD CONSTRAINT "SupportCallLog_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportCallLog" ADD CONSTRAINT "SupportCallLog_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminRefund" ADD CONSTRAINT "AdminRefund_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminRefund" ADD CONSTRAINT "AdminRefund_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferUndo" ADD CONSTRAINT "TransferUndo_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferUndo" ADD CONSTRAINT "TransferUndo_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollGroup" ADD CONSTRAINT "PayrollGroup_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollEmployee" ADD CONSTRAINT "PayrollEmployee_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollEmployee" ADD CONSTRAINT "PayrollEmployee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollEmployee" ADD CONSTRAINT "PayrollEmployee_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "PayrollGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollRun" ADD CONSTRAINT "PayrollRun_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "PayrollEmployee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolStudent" ADD CONSTRAINT "SchoolStudent_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolStudent" ADD CONSTRAINT "SchoolStudent_parentUserId_fkey" FOREIGN KEY ("parentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolFeePeriod" ADD CONSTRAINT "SchoolFeePeriod_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolFeePayment" ADD CONSTRAINT "SchoolFeePayment_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "SchoolFeePeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolFeePayment" ADD CONSTRAINT "SchoolFeePayment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "SchoolStudent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmerDeliveryLog" ADD CONSTRAINT "FarmerDeliveryLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmerDeliveryLog" ADD CONSTRAINT "FarmerDeliveryLog_farmerUserId_fkey" FOREIGN KEY ("farmerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmerDeliveryLog" ADD CONSTRAINT "FarmerDeliveryLog_verifiedByUserId_fkey" FOREIGN KEY ("verifiedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockedUserId_fkey" FOREIGN KEY ("blockedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockedBusinessId_fkey" FOREIGN KEY ("blockedBusinessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_targetBusinessId_fkey" FOREIGN KEY ("targetBusinessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFriend" ADD CONSTRAINT "UserFriend_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFriend" ADD CONSTRAINT "UserFriend_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_toId_fkey" FOREIGN KEY ("toId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVouch" ADD CONSTRAINT "UserVouch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVouch" ADD CONSTRAINT "UserVouch_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfflineSyncQueue" ADD CONSTRAINT "OfflineSyncQueue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPollVote" ADD CONSTRAINT "UserPollVote_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "UserPoll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelPost" ADD CONSTRAINT "ChannelPost_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelFollow" ADD CONSTRAINT "ChannelFollow_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentProfile" ADD CONSTRAINT "AgentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentPayout" ADD CONSTRAINT "AgentPayout_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AgentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentDeposit" ADD CONSTRAINT "AgentDeposit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentDeposit" ADD CONSTRAINT "AgentDeposit_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AgentProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentWithdrawal" ADD CONSTRAINT "AgentWithdrawal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentWithdrawal" ADD CONSTRAINT "AgentWithdrawal_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AgentProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentFloatEntry" ADD CONSTRAINT "AgentFloatEntry_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AgentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StripeDeposit" ADD CONSTRAINT "StripeDeposit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateProfile" ADD CONSTRAINT "AffiliateProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateLink" ADD CONSTRAINT "AffiliateLink_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "AffiliateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateLink" ADD CONSTRAINT "AffiliateLink_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateLink" ADD CONSTRAINT "AffiliateLink_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateCommission" ADD CONSTRAINT "AffiliateCommission_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "AffiliateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NuLekkSplit" ADD CONSTRAINT "NuLekkSplit_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NuLekkSplit" ADD CONSTRAINT "NuLekkSplit_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NuLekkShare" ADD CONSTRAINT "NuLekkShare_splitId_fkey" FOREIGN KEY ("splitId") REFERENCES "NuLekkSplit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NuLekkShare" ADD CONSTRAINT "NuLekkShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KebuInvestmentOffering" ADD CONSTRAINT "KebuInvestmentOffering_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KebuInvestment" ADD CONSTRAINT "KebuInvestment_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "KebuInvestmentOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KebuInvestment" ADD CONSTRAINT "KebuInvestment_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KebuInvestmentPayout" ADD CONSTRAINT "KebuInvestmentPayout_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "KebuInvestment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KoriRedemptionOffer" ADD CONSTRAINT "KoriRedemptionOffer_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KoriRedemption" ADD CONSTRAINT "KoriRedemption_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "KoriRedemptionOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KoriRedemption" ADD CONSTRAINT "KoriRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

