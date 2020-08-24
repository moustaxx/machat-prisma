import { PrismaClient } from '@prisma/client';
import { FastifyInstance } from 'fastify';
import { createFastifyGQLTestClient } from 'fastify-gql-integration-testing';

import main from '../../../..';
import { createRandomUser, gqlRequest } from '../../../../tests/helpers';

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

it('should log out', async () => {
    const { username, password, user } = await createRandomUser(client);

    const loginRes = await gqlRequest(app, {
        query: `
            query login($username: String!, $password: String!) {
                login(username: $username, password: $password) {
                    id
                }
            }
        `,
        variables: { username, password },
    });

    const dirtyCookies = loginRes.cookies;
    let cookies: Record<string, string> = {};
    dirtyCookies.forEach((cookie) => {
        cookies = { ...cookies, [cookie.name]: cookie.value };
    });

    const logoutRes = await gqlRequest(app, {
        query: `
            query logout {
                logout {
                    id
                }
            }
        `,
        cookies,
    });

    const cookiesAfterLogout = logoutRes.cookies;
    const loggedIn = cookiesAfterLogout.find((cookie) => cookie.name === 'loggedIn');

    const logoutJson = await logoutRes.json();

    expect(loggedIn?.value).toEqual('0');
    expect(logoutJson.data.logout.id).toBe(user.id);
});

it('should throw error if not logged in try to log out', async () => {
    const { errors } = await testClient.query(`
        query logout {
            logout {
                id
            }
        }
    `);

    const errorCode = errors && errors[0].extensions?.code;
    expect(errorCode).toEqual('UNAUTHORIZED');
});
