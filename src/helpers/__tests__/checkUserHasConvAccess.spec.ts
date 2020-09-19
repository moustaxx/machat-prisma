import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import { ForbiddenError } from 'apollo-server-errors';

import checkUserHasConvAccess from '../checkUserHasConvAccess';
import { createRandomUser } from '../../tests/helpers';

let prisma: PrismaClient;

beforeAll(async () => {
    prisma = new PrismaClient();
});

afterAll(async () => {
    await prisma.$disconnect();
});

it('should return that user can access the conversation', async () => {
    const { user } = await createRandomUser(prisma);

    const conversation = await prisma.conversation.create({
        data: {
            name: randomBytes(8).toString('hex'),
            participants: { connect: { id: user.id } },
        },
    });

    await checkUserHasConvAccess(prisma, user, conversation.id);
});

it('should throw error that user cannot access the conversation', async () => {
    const { user } = await createRandomUser(prisma);

    const conversation = await prisma.conversation.create({
        data: {
            name: randomBytes(8).toString('hex'),
        },
    });

    await checkUserHasConvAccess(prisma, user, conversation.id).catch((error) => {
        expect(error).toEqual(new ForbiddenError('Insufficient permissions'));
    });
});
