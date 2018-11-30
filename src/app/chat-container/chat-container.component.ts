import { Component, ElementRef, ViewChild } from '@angular/core';
import { Subject, combineLatest, Observable } from 'rxjs';
import {
    debounceTime,
    distinctUntilChanged,
    throttleTime
} from 'rxjs/operators';
import Channel from '../models/channel';
import Contact from '../models/contact';
import Message from '../models/message';
import { MessageService } from './../services/message.service';

@Component({
    selector: 'app-chat-container',
    templateUrl: './chat-container.component.html',
    styleUrls: ['./chat-container.component.css']
})
export class ChatContainerComponent {
    private me: Contact;
    private them: Contact;
    private myChannels: Channel[] = [];
    private contacts: Contact[] = [];
    private writingContacts: string[] = [];
    private messages: Message[] = [];
    private activeChannel: string;
    private newMsg = '';
    private editingMessage: Message;
    private newMessageWritingSubject = new Subject();
    private scrolledTopSubject = new Subject();
    @ViewChild('messageContainer') private messageContainer: ElementRef;

    constructor(private messageService: MessageService) {}

    ngOnInit(): void {
        this.messageService.getContacts().subscribe(contacts => {
            this.contacts = contacts;
        });
        const container = this.messageContainer.nativeElement;
        container.addEventListener('wheel', (e: any) => {
            if (
                this.activeChannel &&
                this.me &&
                e.deltaY < 0 &&
                container.scrollTop <= 150
            ) {
                // scrolling up
                this.emitScrollTop();
            }
        });
    }

    sendMessage(content: string) {
        if (this.messages.length) {
            this.messageService
                .sendMessage(
                    {
                        content,
                        sender: this.me
                    },
                    this.activeChannel
                )
                .subscribe();
        } else {
            this.messageService.sendFirstMessage(
                {
                    content,
                    sender: this.me
                },
                this.activeChannel,
                [this.me, this.them]
            );
        }
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
        this.messages = [];
        this.activeChannel =
            this.me.id < contactId
                ? `${this.me.id}_${contactId}`
                : `${contactId}_${this.me.id}`;
        this.them = this.contacts.find(c => c.id === contactId);
        this.messageService
            .getMessages(this.activeChannel, this.me)
            .subscribe(messages => {
                this.messages = messages;
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
        this.scrolledTopSubject
            .asObservable()
            .pipe(
                distinctUntilChanged(),
                throttleTime(100)
            )
            .subscribe(() => {
                this.loadMore();
            });
    }

    become(contact: Contact) {
        this.me = contact;
        this.messageService.getMyChannelsInfo(this.me).subscribe(channels => {
            combineLatest(
                channels.map(c => this.messageService.getChannelData(c.id))
            ).subscribe(results => {
                const channelInfos = results.filter(c => !!c).map((c, i) => ({
                    ...c,
                    lastRead: channels[i].lastRead
                }));
                console.log(channelInfos);
                // use this to build the contact list
                // compare lastRead with lastMessageSent to show unread channels
            });
        });
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

    loadMore() {
        this.messageService
            .getMessages(this.activeChannel, this.me, this.messages[0], 3)
            .subscribe(messages => {
                this.messages = [...messages, ...this.messages];
            });
    }

    emitScrollTop() {
        this.scrolledTopSubject.next(
            this.messages.length ? this.messages[0].id : '-1'
        );
    }
}
