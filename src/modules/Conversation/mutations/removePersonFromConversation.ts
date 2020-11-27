import { mutationField, intArg, nonNull } from '@nexus/schema';
import checkUserHasConvAccess from '../../../helpers/checkUserHasConvAccess';
import isAuthorized from '../../../helpers/isAuthorized';

export const removePersonFromConversationMutationField = mutationField(
    'removePersonFromConversation', {
        type: 'Conversation',
        args: {
            personId: nonNull(intArg()),
            conversationId: nonNull(intArg()),
        },
        resolve: async (_root, args, { prisma, session }) => {
            isAuthorized(session);

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
