import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { SubscriptionContext } from 'mercurius/lib/subscriber';

import { ISession } from './types';
import prisma, { TPrisma } from './prismaClient';
import PersonActiveStatus from './PersonActiveStatus';
import PubSub from './PubSub';

interface TMyContext {
    req: FastifyRequest;
    reply: FastifyReply;
    prisma: TPrisma;
    session?: ISession;
    personActiveStatus: PersonActiveStatus;
}

export interface Context extends TMyContext {
    app: FastifyInstance;
    pubsub: PubSub;
}

export interface WSContext extends Omit<TMyContext, 'reply'> {
    pubsub: SubscriptionContext;
    /** Fix type when needed */
    lruGatewayResolvers: any;
    reply: {
        request: { headers: {} };
    };
}

export async function createContext(
    req: FastifyRequest,
    reply: FastifyReply,
): TMyContext {
    const session = req.session as ISession;
    const ownerID = session.owner?.id;
    if (ownerID) req.personActiveStatus.set(ownerID, true);

    return {
        req,
        reply,
        prisma,
        session,
        personActiveStatus: req.personActiveStatus,
    };
}
