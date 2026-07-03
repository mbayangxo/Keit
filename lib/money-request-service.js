import { creditKoriEarn, sendKoriTransfer } from './kori-service.js';
import { notifyMoneyReceived } from './notify-service.js';
import { InsufficientFundsError, runMoneyTransaction, transferNational } from './wallet-atomic.js';
export function moneyRequestShape(request) {
    return {
        id: request.id,
        reference: request.reference,
        amount: request.amount,
        currency: request.currency,
        note: request.note,
        voiceNoteUrl: request.voiceNoteUrl,
        status: request.status,
        respondedAt: request.respondedAt?.toISOString() ?? null,
        createdAt: request.createdAt.toISOString(),
        requester: {
            id: request.requester.id,
            name: request.requester.name ?? '',
            handle: request.requester.handle ?? '',
            avatarEmoji: request.requester.avatarEmoji ?? '👤',
        },
        payer: {
            id: request.payer.id,
            name: request.payer.name ?? '',
            handle: request.payer.handle ?? '',
            avatarEmoji: request.payer.avatarEmoji ?? '👤',
        },
    };
}
const requestInclude = {
    requester: { select: { id: true, name: true, handle: true, avatarEmoji: true } },
    payer: { select: { id: true, name: true, handle: true, avatarEmoji: true } },
};
export async function acceptMoneyRequest(db, params) {
    const request = await db.moneyRequest.findUnique({
        where: { id: params.requestId },
        include: {
            ...requestInclude,
            requester: { include: { wallet: true } },
            payer: { include: { wallet: true } },
        },
    });
    if (!request)
        throw new RequestError('not_found', 'Money request not found');
    if (request.payerId !== params.payerUserId)
        throw new RequestError('forbidden', 'Only the payer can accept');
    if (request.status !== 'pending')
        throw new RequestError('invalid_state', `Request is already ${request.status}`);
    const payerWallet = request.payer.wallet;
    const requesterWallet = request.requester.wallet;
    if (!payerWallet || !requesterWallet)
        throw new RequestError('wallet_missing', 'Wallet not found');
    const ref = request.reference;
    const now = new Date();
    await runMoneyTransaction(db, async (tx) => {
        if (request.currency === 'kori') {
            if (payerWallet.koriBalance < request.amount)
                throw new RequestError('insufficient', 'Insufficient Kori balance');
            await sendKoriTransfer(tx, {
                senderId: request.payerId,
                senderWalletId: payerWallet.id,
                recipientId: request.requesterId,
                recipientWalletId: requesterWallet.id,
                amountKori: request.amount,
                reference: ref,
                note: request.note ?? undefined,
            });
        }
        else {
            try {
                await transferNational(tx, {
                    amount: request.amount,
                    senderWalletId: payerWallet.id,
                    recipientWalletId: requesterWallet.id,
                    senderUserId: request.payerId,
                    recipientUserId: request.requesterId,
                    reference: ref,
                    senderLedger: {
                        type: 'send',
                        counterpartyName: request.requester.name,
                        counterpartyHandle: request.requester.handle,
                        note: request.note ?? "Demande d'argent acceptée",
                    },
                    recipientLedger: {
                        type: 'receive',
                        counterpartyName: request.payer.name,
                        counterpartyHandle: request.payer.handle,
                        note: request.note ?? "Demande d'argent acceptée",
                    },
                });
            }
            catch (error) {
                if (error instanceof InsufficientFundsError)
                    throw new RequestError('insufficient', error.message);
                throw error;
            }
            await creditKoriEarn(tx, request.payerId, payerWallet.id, 'send', `${ref}-EARN`);
        }
        await tx.moneyRequest.update({
            where: { id: request.id },
            data: { status: 'accepted', respondedAt: now },
        });
    });
    await notifyMoneyReceived(request.requesterId, {
        amount: request.amount,
        currency: request.currency === 'kori' ? 'kori' : 'national',
        senderLabel: request.payer.name ?? request.payer.handle,
    });
    return db.moneyRequest.findUniqueOrThrow({ where: { id: request.id }, include: requestInclude });
}
export async function denyMoneyRequest(db, params) {
    const request = await db.moneyRequest.findUnique({ where: { id: params.requestId }, include: requestInclude });
    if (!request)
        throw new RequestError('not_found', 'Money request not found');
    if (request.payerId !== params.payerUserId)
        throw new RequestError('forbidden', 'Only the payer can deny');
    if (request.status !== 'pending')
        throw new RequestError('invalid_state', `Request is already ${request.status}`);
    const now = new Date();
    await db.$transaction(async (tx) => {
        await tx.moneyRequest.update({
            where: { id: request.id },
            data: { status: 'denied', respondedAt: now },
        });
        await tx.notification.create({
            data: {
                userId: request.requesterId,
                title: 'Demande refusée',
                body: `${request.payer.name ?? request.payer.handle} a refusé ta demande de ${request.amount.toLocaleString('fr-FR')} F`,
            },
        });
    });
    return db.moneyRequest.findUniqueOrThrow({ where: { id: request.id }, include: requestInclude });
}
export async function cancelMoneyRequest(db, params) {
    const request = await db.moneyRequest.findUnique({ where: { id: params.requestId }, include: requestInclude });
    if (!request)
        throw new RequestError('not_found', 'Money request not found');
    if (request.requesterId !== params.requesterUserId)
        throw new RequestError('forbidden', 'Only the requester can cancel');
    if (request.status !== 'pending')
        throw new RequestError('invalid_state', `Request is already ${request.status}`);
    const now = new Date();
    await db.moneyRequest.update({
        where: { id: request.id },
        data: { status: 'cancelled', respondedAt: now },
    });
    return db.moneyRequest.findUniqueOrThrow({ where: { id: request.id }, include: requestInclude });
}
export class RequestError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'RequestError';
    }
}
export function requestErrorStatus(code) {
    switch (code) {
        case 'not_found':
            return 404;
        case 'forbidden':
            return 403;
        case 'insufficient':
        case 'invalid_state':
        case 'wallet_missing':
            return 400;
        default:
            return 400;
    }
}
