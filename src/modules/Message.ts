import { objectType, mutationField, intArg, stringArg } from '@nexus/schema';
import { ForbiddenError, ApolloError } from 'apollo-server-errors';

// eslint-disable-next-line import/prefer-default-export
export const Message = objectType({
    name: 'Message',
    definition(t) {
        t.model.id();
        t.model.content();
        t.model.conversation();
        t.model.conversationID();
        t.model.authorID();
        t.model.author();
        t.model.createdAt();
    },
});

export const createMessageMutationField = mutationField('createMessage', {
    type: 'Message',
    args: {
        content: stringArg({ required: true }),
        conversationId: intArg({ required: true }),
    },
    resolve: async (_root, args, { prisma, session }) => {
        if (!session || !session.isLoggedIn || !session.owner) {
            throw new ForbiddenError('You must be logged in!');
        }

        const data = await prisma.message.create({
            data: {
                content: args.content,
                author: {
                    connect: { id: session.owner.id },
                },
                conversation: {
                    connect: { id: args.conversationId },
                },
            },
        });

        if (!data) throw new ApolloError('No data!', 'NO_DATA');

        return data;
    },
});
