import { mutationField, stringArg } from '@nexus/schema';
import { ApolloError, ValidationError } from 'apollo-server-errors';
import argon2 from 'argon2';

import isValidEmail from '../helpers/isValidEmail';

export const registerMutationField = mutationField('register', {
    type: 'Person',
    args: {
        email: stringArg({ required: true }),
        username: stringArg({ required: true }),
        password: stringArg({ required: true }),
    },
    resolve: async (_, args, { prisma, session }) => {
        if (session?.isLoggedIn) {
            throw new ApolloError('You are already logged in!', 'ALREADY_LOGGED_IN');
        }

        const username = args.username.trim();
        const email = args.email.trim();
        const { password } = args;

        if (username.length <= 3) throw new ValidationError('Username length must be > 3');
        if (username.length > 20) throw new ValidationError('Username length must be > 20');

        if (password.length <= 5) throw new ValidationError('Password length must be > 5');
        if (password.length > 100) throw new ValidationError('Password length must be < 100');

        if (!isValidEmail(email)) throw new ValidationError('Wrong email');

        const hash = await argon2.hash(password);

        const data = await prisma.person.create({
            data: {
                email,
                username,
                hash,
            },
        });

        if (!session) throw new ApolloError('No session!', 'NO_SESSION');
        session.isLoggedIn = true;
        session.owner = data;
        return data;
    },
});
