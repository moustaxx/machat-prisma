import { PrismaClient } from '@prisma/client';
import { FastifyInstance } from 'fastify';
import { createFastifyGQLTestClient } from 'fastify-gql-integration-testing';

import main from '../../../..';
import { createRandomUser, createRandomUserAndLogin } from '../../../../tests/helpers';

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

const queryString = `
    query login($username: String!, $password: String!) {
        login(username: $username, password: $password) {
            id
        }
    }
`;

it('should log in', async () => {
    const { cookiesArray } = await createRandomUserAndLogin(app, client);
    const loggedIn = cookiesArray.find((cookie) => cookie.name === 'loggedIn');

    expect(loggedIn?.value).toEqual('1');
});

it('should throw error when already logged in', async () => {
    const { username, password, cookies } = await createRandomUserAndLogin(app, client);

    const { errors } = await testClient.query(queryString, {
        cookies,
        variables: { username, password },
    });

    const errorCode = errors?.[0].extensions?.code;
    expect(errorCode).toEqual('ALREADY_LOGGED_IN');
});

it('should throw error when wrong password', async () => {
    const { username } = await createRandomUser(client);

    const { errors } = await testClient.query(queryString, {
        variables: { username, password: 'wrong_password' },
    });

    const errorCode = errors?.[0].extensions?.code;
    expect(errorCode).toEqual('GRAPHQL_VALIDATION_FAILED');
});
