import { initTestServer, ITestUtils } from '../../../../tests/helpers';

let t: ITestUtils;

beforeAll(async () => {
    t = await initTestServer();
});

afterAll(async () => {
    await t.closeTestServer();
});

const queryString = `
    query logout {
        logout {
            id
        }
    }
`;

it('should log out', async () => {
    const { user, cookies } = await t.createRandomUserAndLogin();

    const logoutRes = await t.gqlRequest({
        query: queryString,
        cookies,
    });

    const cookiesAfterLogout = logoutRes.cookies;
    const loggedIn = cookiesAfterLogout.find((cookie) => cookie.name === 'loggedIn');

    const logoutJson = await logoutRes.json();

    expect(loggedIn?.value).toEqual('0');
    expect(logoutJson.data.logout.id).toBe(user.id);
});

it('should throw error if not logged in try to log out', async () => {
    const { errors } = await t.gqlQuery({ query: queryString });

    const errorCode = errors?.[0].extensions?.code;
    expect(errorCode).toEqual('UNAUTHORIZED');
});
