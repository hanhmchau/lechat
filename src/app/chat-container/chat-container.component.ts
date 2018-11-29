import { MessageService } from './../services/message.service';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import Contact from '../models/contact';
import Message from '../models/message';
import { filter, throttleTime, debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
    selector: 'app-chat-container',
    templateUrl: './chat-container.component.html',
    styleUrls: ['./chat-container.component.css']
})
export class ChatContainerComponent {
    private me: Contact;
    private contacts: Contact[] = [];
    private writingContacts: string[] = [];
    private messages: Message[] = [];
    private activeChannel: string;
    private newMsg = '';
    private editingMessage: Message;
    private newMessageWritingSubject = new Subject();

    constructor(private messageService: MessageService) {}

    ngOnInit(): void {
        this.messageService.getContacts().subscribe(contacts => {
            console.log(contacts);
            this.contacts = contacts;
        });
    }

    sendMessage(content: string) {
        this.messageService
            .sendMessage(
                {
                    content,
                    sender: this.me
                },
                this.activeChannel
            )
            .subscribe(id => {
                console.log(id);
            });
    }

    updateMessage(content: string) {
        this.editingMessage.content = content;
        this.editingMessage.edited = true;
        this.messageService.updateMessage(
            this.editingMessage,
            this.activeChannel
        );
    }

    onMessageSent(content: string) {
        if (this.activeChannel && content.trim()) {
            if (this.editingMessage) {
                this.updateMessage(content);
                this.cancelEditing();
            } else {
                this.sendMessage(content);
            }
            this.newMsg = '';
        }
    }

    generateContacts() {
        this.messageService.generateContacts();
    }

    connect(contactId: string) {
        this.activeChannel =
            this.me.id < contactId
                ? `${this.me.id}_${contactId}`
                : `${contactId}_${this.me.id}`;
        this.messageService
            .getMessages(this.activeChannel)
            .subscribe(messages => {
                this.messages = messages;
                console.log(this.messages);
            });
        this.messageService
            .getChannelData(this.activeChannel)
            .subscribe(console.log);
        this.newMessageWritingSubject
            .asObservable()
            .pipe(debounceTime(1500))
            .subscribe(() => {
                this.messageService.setIsNotWriting(
                    this.me,
                    this.activeChannel
                );
            });
        this.newMessageWritingSubject
            .asObservable()
            .pipe(throttleTime(1000))
            .subscribe(() => {
                this.messageService.setIsWriting(this.me, this.activeChannel);
            });
        this.messageService
            .getWritingMembersInChannel(this.activeChannel)
            .subscribe(contacts => {
                this.writingContacts = contacts
                    .filter(c => c.id !== this.me.id)
                    .map(c => c.name);
            });
    }

    become(contact: Contact) {
        this.me = contact;
    }

    delete(id: string) {
        this.messages = this.messages.filter(msg => msg.id !== id);
        this.messageService.deleteMessage(id, this.activeChannel);
    }

    cancelEditing() {
        this.editingMessage = undefined;
        this.newMsg = '';
    }

    startEditing(message: Message) {
        this.newMsg = message.content;
        this.editingMessage = message;
    }

    isWriting() {
        this.newMessageWritingSubject.next();
    }

    upload(ev: any) {
        this.messageService.uploadFile(
            this.me,
            this.activeChannel,
            ev.target.files[0]
        );
    }
}
