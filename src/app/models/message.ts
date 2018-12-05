import Contact from './contact';
import Attachment from './attachment';

export default class Message {
    id?: string;
    sender: Contact;
    content: string;
    timestamp?: Date;
    edited?: boolean;
    attachment?: Attachment;
    placement?: string;
}
