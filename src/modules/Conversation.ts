import { objectType } from '@nexus/schema';

// eslint-disable-next-line import/prefer-default-export
export const Conversation = objectType({
    name: 'Conversation',
    definition(t) {
        t.model.id();
        t.model.name();
        t.model.message();
        t.model.createdAt();
    },
});
