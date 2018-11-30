import Channel from './channel';

export default class Contact {
    id?: string;
    name?: string;
    isOnline?: boolean;
    isWriting?: boolean;
    lastReadThisChannel?: Date;
    channels?: Channel[];
}
