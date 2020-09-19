import { PrismaClient } from '@prisma/client';
import { FastifyInstance } from 'fastify';
import { createFastifyGQLTestClient, GQLResponse } from 'fastify-gql-integration-testing';
import { randomBytes } from 'crypto';

import { NexusGenRootTypes } from '../../../../generated/nexus';
import {
    gqlRequest,
    createRandomUserAndLogin,
    initTestServer,
    closeTestServer,
} from '../../../../tests/helpers';

let prisma: PrismaClient;
let app: FastifyInstance;
let testClient: ReturnType<typeof createFastifyGQLTestClient>;

beforeAll(async () => {
    const testing = await initTestServer();
    app = testing.app;
    prisma = testing.app.prisma;
    testClient = testing.testClient;
});

afterAll(async () => {
    await closeTestServer(app);
});

const queryString = `
    query conversation($whereId: Int!) {
        conversation(whereId: $whereId) {
            id
        }
    }
`;

it('should return conversation', async () => {
    const { cookies, user } = await createRandomUserAndLogin(app);

    const conversation = await prisma.conversation.create({
        data: {
            name: randomBytes(8).toString('hex'),
            participants: { connect: { id: user.id } },
        },
    });

    const conversationRes = await gqlRequest(app, {
        cookies,
        query: queryString,
        variables: { whereId: conversation.id },
    });

    type TData = GQLResponse<{ conversation: NexusGenRootTypes['Conversation'] }>;
    const { data }: TData = await conversationRes.json();

    expect(data.conversation.id).toBeTruthy();
});

it('should throw FORBIDDEN error when not permitted', async () => {
    const { cookies } = await createRandomUserAndLogin(app);

    const conversation = await prisma.conversation.create({
        data: {
            name: randomBytes(8).toString('hex'),
        },
    });

    const data = await testClient.query(queryString, {
        cookies,
        variables: { whereId: conversation.id },
    });

    const errorCode = data.errors?.[0].extensions?.code;
    expect(errorCode).toEqual('FORBIDDEN');
});

it('should throw error when not authorized', async () => {
    const conversation = await prisma.conversation.create({
        data: {
            name: randomBytes(8).toString('hex'),
        },
    });

    const data = await testClient.query(queryString, {
        variables: { whereId: conversation.id },
    });

    const errorCode = data.errors?.[0].extensions?.code;
    expect(errorCode).toEqual('UNAUTHORIZED');
});