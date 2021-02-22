/** @jest-environment node */
import { ApolloError } from 'apollo-server-errors';
import { ISession } from '../../types';
import isAuthorized from '../isAuthorized';

const unauthorizedError = new ApolloError('You must be logged in!', 'UNAUTHORIZED');

const owner: ISession['owner'] = {
    id: 1,
    username: 'test',
    email: 'test@machat.ru',
    createdAt: new Date(),
    lastSeen: new Date(),
    isAdmin: false,
};


it('should pass', () => {
    const session = {
        isLoggedIn: true,
        owner,
    } as any;

    isAuthorized(session);
});

it('should throw error when isLoggedIn is false', () => {
    const session = {
        isLoggedIn: false,
        owner,
    } as any;

    const fn = () => isAuthorized(session);
    expect(fn).toThrow(unauthorizedError);
});

it('should throw error when no owner', () => {
    const session = {
        isLoggedIn: true,
    } as any;

    const fn = () => isAuthorized(session);
    expect(fn).toThrow(unauthorizedError);
});

it('should throw error when no session', () => {
    const fn = () => isAuthorized();
    expect(fn).toThrow(unauthorizedError);
});
