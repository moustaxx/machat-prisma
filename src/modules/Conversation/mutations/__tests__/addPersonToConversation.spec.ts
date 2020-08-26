import { PrismaClient } from '@prisma/client';
import { FastifyInstance } from 'fastify';
import { createFastifyGQLTestClient } from 'fastify-gql-integration-testing';
import { randomBytes } from 'crypto';

import main from '../../../..';
import { createRandomUserAndLogin, createRandomUser } from '../../../../tests/helpers';
import { Conversation, Person } from '../../../../../node_modules/.prisma/client';

let client: PrismaClient;
let app: FastifyInstance;
let testClient: ReturnType<typeof createFastifyGQLTestClient>;

beforeAll(async () => {
    client = new PrismaClient();
    app = await main(true);
    testClient = createFastifyGQLTestClient(app);
});

afterAll(async () => {
    await Promise.allSettled([
        client.$disconnect(),
        app.close(),
    ]);
});

it('should add person to conversation', async () => {
    const someUser = await createRandomUser(client);
    const { user, cookies } = await createRandomUserAndLogin(app, client);

    const conversation = await client.conversation.create({
        data: {
            name: randomBytes(8).toString('hex'),
            participants: { connect: { id: user.id } },
        },
    });

    type TData = { addPersonToConversation: Conversation & {
        participants: Person[];
    } };
    const { data } = await testClient.mutate<TData>(`
        mutation addPersonToConversation($personId: Int!, $conversationId: Int!) {
            addPersonToConversation(personId: $personId, conversationId: $conversationId) {
                id
                participants {
                    username
                    id
                }
            }
        }
    `, {
        cookies,
        variables: { personId: someUser.user.id, conversationId: conversation.id },
    });

    const { participants } = data.addPersonToConversation;

    const isParticipated = !!participants.find((participant) => {
        return participant.id === someUser.user.id;
    })?.id;
    expect(isParticipated).toBeTruthy();
});

it('should throw error when not permitted', async () => {
    const someUser = await createRandomUser(client);
    const { cookies } = await createRandomUserAndLogin(app, client);

    const conversation = await client.conversation.create({
        data: {
            name: randomBytes(8).toString('hex'),
        },
    });

    const { errors } = await testClient.mutate(`
        mutation addPersonToConversation($personId: Int!, $conversationId: Int!) {
            addPersonToConversation(personId: $personId, conversationId: $conversationId) {
                id
                participants {
                    username
                    id
                }
            }
        }
    `, {
        cookies,
        variables: { personId: someUser.user.id, conversationId: conversation.id },
    });

    const errorCode = errors && errors[0].extensions?.code;
    expect(errorCode).toEqual('FORBIDDEN');
});

it('should throw error when not authorized', async () => {
    const someUser = await createRandomUser(client);

    const conversation = await client.conversation.create({
        data: {
            name: randomBytes(8).toString('hex'),
        },
    });

    const { errors } = await testClient.mutate(`
        mutation addPersonToConversation($personId: Int!, $conversationId: Int!) {
            addPersonToConversation(personId: $personId, conversationId: $conversationId) {
                id
                participants {
                    username
                    id
                }
            }
        }
    `, {
        variables: { personId: someUser.user.id, conversationId: conversation.id },
    });

    const errorCode = errors && errors[0].extensions?.code;
    expect(errorCode).toEqual('UNAUTHORIZED');
});
