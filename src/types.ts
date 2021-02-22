import { Person } from '@prisma/client';

export interface ISession {
    sessionId: string;
    encryptedSessionId: string;
    /** Updates the `expires` property of the session. */
    touch(): void;
    /** Regenerates the session by generating a new `sessionId`. */
    regenerate(): void;

    isLoggedIn?: boolean;
    expires?: Date;
    owner?: Omit<Person, 'hash'>;
}
