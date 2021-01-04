import { nexusSchemaPrisma } from 'nexus-plugin-prisma/schema';
import { makeSchema, asNexusMethod, connectionPlugin } from 'nexus';
import { GraphQLDate } from 'graphql-iso-date';

import * as allTypes from './modules';

export const GQLDate = asNexusMethod(GraphQLDate, 'createdAt');

export const schema = makeSchema({
    types: [allTypes],
    plugins: [
        nexusSchemaPrisma({
            experimentalCRUD: true,
            outputs: {
                typegen: `${__dirname}/generated/typegen-nexus-plugin-prisma.d.ts`,
            },
        }),
        connectionPlugin(),
    ],
    nonNullDefaults: {
        output: true,
    },
    outputs: {
        schema: `${__dirname}/../schema.graphql`,
        typegen: `${__dirname}/generated/nexus.d.ts`,
    },
    contextType: {
        module: require.resolve('./context'),
        alias: 'Context',
        export: 'Context.Context',
    },
    sourceTypes: {
        modules: [
            { module: '@prisma/client', alias: 'prisma' },
        ],
    },
});
