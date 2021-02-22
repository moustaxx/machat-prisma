import { Ctx, Args, Resolver, Mutation, ArgsType, Field, Int } from 'type-graphql';
import { Context } from '../../../context';
import checkUserHasConvAccess from '../../../helpers/checkUserHasConvAccess';
import isAuthorized from '../../../helpers/isAuthorized';
import { ConversationType } from '../ConversationType';

@ArgsType()
class AddPersonToConversationArgs {
    @Field((_type) => Int)
    conversationId!: number;

    @Field((_type) => Int)
    personId!: number;
}

@Resolver((_of) => ConversationType)
export class AddPersonToConversationResolver {
    @Mutation((_returns) => ConversationType)
    async addPersonToConversation(
    // eslint-disable-next-line @typescript-eslint/indent
        @Args() args: AddPersonToConversationArgs,
        @Ctx() { prisma, session }: Context,
    ) {
        isAuthorized(session);

        await checkUserHasConvAccess(prisma, session.owner, args.conversationId);

        const data = await prisma.conversation.update({
            where: { id: args.conversationId },
            data: {
                participants: {
                    connect: { id: args.personId },
                },
            },
        });

        return data;
    }
}
