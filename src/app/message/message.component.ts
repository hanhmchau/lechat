import { Component, EventEmitter, Input, Output } from '@angular/core';
import Message from '../models/message';
import Contact from '../models/contact';
import { MessageService } from './../services/message.service';
import Preview from '../models/preview';
const getUrls = require('get-urls');

@Component({
    selector: 'app-message',
    templateUrl: './message.component.html',
    styleUrls: ['./message.component.css']
})
export class MessageComponent {
    @Input() message: Message;
    @Input() me: Contact;
    @Output() onDelete = new EventEmitter<string>();
    @Output() onEdit = new EventEmitter<Message>();
    private preview: Preview;
    private previewImage: string;

    constructor(private messageService: MessageService) {}

    ngOnInit(): void {
        this.processPreviewImage();
    }

    processPreviewImage(): void {
        const urls = getUrls(this.message.content || '');
        const url = urls.values().next();
        if (url.value && /\.(?:jpg|gif|png)$/.test(url.value)) {
            this.previewImage = url.value;
            console.log(this.previewImage);
        }
    }

    delete(id: string) {
        this.onDelete.emit(this.message.id);
    }

    startEditing(message: Message) {
        this.onEdit.emit(this.message);
    }
}
