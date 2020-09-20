import { mutationField, intArg } from '@nexus/schema';
import { ApolloError } from 'apollo-server-errors';
import checkUserHasConvAccess from '../../../helpers/checkUserHasConvAccess';

export const removePersonFromConversationMutationField = mutationField(
    'removePersonFromConversation', {
        type: 'Conversation',
        args: {
            personId: intArg({ required: true }),
            conversationId: intArg({ required: true }),
        },
        resolve: async (_root, args, { prisma, session }) => {
            if (!session || !session.isLoggedIn || !session.owner) {
                throw new ApolloError('You must be logged in!', 'UNAUTHORIZED');
            }

            await checkUserHasConvAccess(prisma, session.owner, args.conversationId);

            const data = await prisma.conversation.update({
                where: { id: args.conversationId },
                data: {
                    participants: {
                        disconnect: { id: args.personId },
                    },
                },
            });

            return data;
        },
    },
);
