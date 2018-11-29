import Contact from './contact';
import Message from './message';

export default class Channel {
    id: string;
    name: string;
    members: Contact[] = [];
    messages: Message[] = [];
}
