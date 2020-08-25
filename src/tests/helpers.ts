import { FastifyInstance } from 'fastify';
import { Response } from 'light-my-request';
import { randomBytes } from 'crypto';
// eslint-disable-next-line import/no-extraneous-dependencies
import { PrismaClient } from '@prisma/client';

import { getHash } from '../modules/Person/helpers/getHash';
import { NexusGenRootTypes } from '../generated/nexus';

export type TCookie = {
    name: string;
    value: string;
    path: string;
    expires: number | Date;
    httpOnly: boolean;
};

interface IQueryParams {
    url?: string;
    query?: string;
    cookies?: {
        [k: string]: string;
    } ;
    headers?: Record<string, string>;
    variables?: Record<string, unknown>;
    operationName?: string;
}

export interface TResponse extends Omit<Response, 'cookies'> {
    cookies: TCookie[];
}

export async function gqlRequest(app: FastifyInstance, {
    url,
    query,
    cookies,
    headers,
    variables,
    operationName,
}: IQueryParams): Promise<TResponse> {
    return app.inject({
        url: url || '/graphql',
        method: 'POST',
        cookies,
        headers: {
            'content-type': 'application/json; charset=utf-8',
            ...headers,
        },
        payload: JSON.stringify({
            query,
            variables,
            operationName,
        }),
    }) as Promise<TResponse>;
}

type TCreateRandomUser = (
    prisma: PrismaClient,
    options?: {
        isAdmin?: boolean;
    },
) => Promise<{
    username: string;
    password: string;
    email: string;
    user: NexusGenRootTypes['Person'];
}>;

export const createRandomUser: TCreateRandomUser = async (prisma, options) => {
    const username = randomBytes(5).toString('hex');
    const password = randomBytes(9).toString('hex');
    const email = `${username}@machat.ru`;

    const salt = randomBytes(16).toString('hex');
    const hash = getHash(password, salt);

    const user = await prisma.person.create({
        data: {
            email,
            username,
            salt,
            hash,
            isAdmin: options?.isAdmin,
        },
    });

    if (!user.id) throw Error('Cannot create random user!');

    return {
        user,
        username,
        password,
        email,
    };
};

type TRandomUserLogin = (
    app: FastifyInstance,
    prisma: PrismaClient,
    options?: {
        isAdmin?: boolean;
    },
) => Promise<{
    user: NexusGenRootTypes['Person'];
    username: string;
    password: string;
    cookies: Record<string, string>;
    cookiesArray: TCookie[];
}>;

export const randomUserLogin: TRandomUserLogin = async (app, prisma, options) => {
    const {
        username,
        password,
        user,
    } = await createRandomUser(prisma, { isAdmin: options?.isAdmin });

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

    const cookiesArray = loginRes.cookies;
    let cookies: Record<string, string> = {};
    cookiesArray.forEach((cookie) => {
        cookies = { ...cookies, [cookie.name]: cookie.value };
    });

    return {
        user,
        username,
        password,
        cookies,
        cookiesArray,
    };
};
