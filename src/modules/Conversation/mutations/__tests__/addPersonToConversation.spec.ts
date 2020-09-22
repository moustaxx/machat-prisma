import { randomBytes } from 'crypto';

import { initTestServer, ITestUtils } from '../../../../tests/helpers';
import { Conversation, Person } from '../../../../../node_modules/.prisma/client';

let t: ITestUtils;

beforeAll(async () => {
    t = await initTestServer();
});

afterAll(async () => {
    await t.closeTestServer();
});

const queryString = `
    mutation addPersonToConversation($personId: Int!, $conversationId: Int!) {
        addPersonToConversation(personId: $personId, conversationId: $conversationId) {
            id
            participants {
                username
                id
            }
        }
    }
`;

it('should add person to conversation', async () => {
    const someUser = await t.createRandomUser();
    const { user, cookies } = await t.createRandomUserAndLogin();

    const conversation = await t.prisma.conversation.create({
        data: {
            name: randomBytes(8).toString('hex'),
            participants: { connect: { id: user.id } },
        },
    });

    type TData = { addPersonToConversation: Conversation & {
        participants: Person[];
    } };
    const { data } = await t.gqlQuery<TData>({
        query: queryString,
        cookies,
        variables: { personId: someUser.user.id, conversationId: conversation.id },
    });

    const { participants } = data.addPersonToConversation;

    expect(participants).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ id: someUser.user.id }),
        ]),
    );
});

it('should throw error when not permitted', async () => {
    const someUser = await t.createRandomUser();
    const { cookies } = await t.createRandomUserAndLogin();

    const conversation = await t.prisma.conversation.create({
        data: { name: randomBytes(8).toString('hex') },
    });

    const { errors } = await t.gqlQuery({
        query: queryString,
        cookies,
        variables: { personId: someUser.user.id, conversationId: conversation.id },
    });

    const errorCode = errors?.[0].extensions?.code;
    expect(errorCode).toEqual('FORBIDDEN');
});

it('should throw error when not authorized', async () => {
    const someUser = await t.createRandomUser();

    const conversation = await t.prisma.conversation.create({
        data: { name: randomBytes(8).toString('hex') },
    });

    const { errors } = await t.gqlQuery({
        query: queryString,
        variables: { personId: someUser.user.id, conversationId: conversation.id },
    });

    const errorCode = errors?.[0].extensions?.code;
    expect(errorCode).toEqual('UNAUTHORIZED');
});
