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
    private scrollTop = 0;
    private memorizedScrollTop = 0;
    private memorizedScrollHeight = 0;
    @ViewChild('messageContainer') private messageContainer: ElementRef;
    @ViewChild('inputFile') private inputFile: ElementRef;

    constructor(private messageService: MessageService) {}

    ngOnInit(): void {
        this.messageService.getContacts().subscribe(contacts => {
            this.contacts = contacts;
        });
        const container = this.messageContainer.nativeElement;
        container.addEventListener('scroll', (e: any) => {
            if (
                this.activeChannel &&
                this.me &&
                container.scrollTop <= this.scrollTop &&
                container.scrollTop <= 150
            ) {
                // scrolling up
                this.emitScrollTop();
            }
            this.scrollTop = container.scrollTop;
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
                this.scrollToBottom();
            });
        this.messageService.createIMChannel(
            this.activeChannel,
            this.me,
            this.them
        );
        this.messageService.getChannelData(this.activeChannel).subscribe();
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

    resumeScrollPosition() {
        setTimeout(() => {
            const container = this.messageContainer.nativeElement;
            container.scrollTop =
                this.memorizedScrollTop +
                (this.getContainerScrollHeight() - this.memorizedScrollHeight);
        }, 0);
    }

    rememberScrollPosition() {
        setTimeout(() => {
            this.memorizedScrollTop = this.getContainerScrollTop();
            this.memorizedScrollHeight = this.getContainerScrollHeight();
        }, 0);
    }

    getContainerScrollHeight() {
        return this.messageContainer.nativeElement.scrollHeight;
    }

    getContainerScrollTop() {
        return this.messageContainer.nativeElement.scrollTop;
    }

    become(contact: Contact) {
        this.me = contact;
        this.messageService.getMyChannelsInfo(this.me).subscribe(channels => {
            combineLatest(
                channels.map(c => this.messageService.getChannelData(c.id))
            ).subscribe(results => {
                const channelInfos = results
                    .map((c, i) => ({
                        ...c,
                        lastRead: channels[i].lastRead
                    }))
                    .map(c =>
                        c.type === 'IM'
                            ? {
                                  ...c,
                                  name: (c as any)[
                                      `${this.me.id}_name`
                                  ] as string,
                                  id: (c as any)[this.me.id] as string
                              }
                            : c
                    );
                this.myChannels = channelInfos;
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
                this.rememberScrollPosition();
                this.messages = [...messages, ...this.messages];
                this.resumeScrollPosition();
            });
    }

    emitScrollTop() {
        this.scrolledTopSubject.next(
            this.messages.length ? this.messages[0].id : '-1'
        );
    }

    triggerInputFile() {
        (this.inputFile.nativeElement as HTMLElement).click();
    }

    private scrollToBottom() {
        setTimeout(() => {
            const container = this.messageContainer.nativeElement;
            container.scrollTop = this.getContainerScrollHeight();
        }, 0);
    }
}
