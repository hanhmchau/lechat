import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './../services/auth.service';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { Subject, combineLatest, Observable, Subscription } from 'rxjs';
import {
    debounceTime,
    distinctUntilChanged,
    throttleTime
} from 'rxjs/operators';
import Channel from '../models/channel';
import Contact from '../models/contact';
import Message from '../models/message';
import { MessageService } from './../services/message.service';
import { insertAtCaret } from '../utils';

@Component({
    selector: 'app-chat-container',
    templateUrl: './chat-container.component.html',
    styleUrls: ['./chat-container.component.css']
})
export class ChatContainerComponent {
    private me: Contact;
    private them: Contact;
    private myChannels: Channel[] = [];
    private myFilteredChannels: Channel[] = [];
    private contacts: Contact[] = [];
    private unaddedContacts: Contact[] = [];
    private writingContacts: string[] = [];
    private messages: Message[] = [];
    private activeChannel: string;
    private activeContactOrChannel: string;
    private newMsg = '';
    private editingMessage: Message;
    private newMessageWritingSubject = new Subject();
    private scrolledTopSubject = new Subject();
    private scrollTop = 0;
    private memorizedScrollTop = 0;
    private memorizedScrollHeight = 0;
    private loading = false;
    private getMessages$: Subscription;
    private getChannelData$: Subscription;
    private isWriting$: Subscription;
    private isNotWriting$: Subscription;
    private getWritingMembers$: Subscription;
    private scrollTop$: Subscription;
    private searchChannelControl = new FormControl('', []);
    private channelLoaded = false;
    @ViewChild('messageContainer') private messageContainer: ElementRef;
    @ViewChild('inputFile') private inputFile: ElementRef;

    constructor(
        private messageService: MessageService,
        private authService: AuthService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.messageService.getContacts().subscribe(contacts => {
            this.contacts = contacts;
            if (this.unaddedContacts) {
                this.unaddedContacts = this.contacts;
            }
        });
        const container = this.messageContainer.nativeElement;
        this.become(this.authService.getCurrentUser());
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
        this.searchChannelControl.valueChanges
            .pipe(throttleTime(100))
            .subscribe((val: string) => {
                if (this.myChannels) {
                    if (val.trim()) {
                        this.myFilteredChannels = this.myChannels.filter(c =>
                            c.name.toLowerCase().includes(val.toLowerCase())
                        );
                    } else {
                        this.myFilteredChannels = this.myChannels;
                    }
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
        content = content.trim();
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

    unsubscribe() {
        if (this.getMessages$) {
            this.getMessages$.unsubscribe();
            this.getChannelData$.unsubscribe();
            this.isWriting$.unsubscribe();
            this.isNotWriting$.unsubscribe();
            this.getWritingMembers$.unsubscribe();
            this.scrollTop$.unsubscribe();
        }
    }

    processPlacements(messages: Message[]): Message[] {
        let markedFirst = 0;
        for (let i = 0; i < messages.length; i++) {
            const thisMsg = messages[i];
            const markedMsg = messages[markedFirst];
            if (
                i === 0 ||
                thisMsg.sender.id !== markedMsg.sender.id ||
                !this.isWithinMinutesOf(
                    thisMsg.timestamp,
                    markedMsg.timestamp,
                    15
                )
            ) {
                thisMsg.placement = 'first';
                markedFirst = i;
            }
        }
        return messages;
    }

    isWithinMinutesOf(after: Date, before: Date, minutes: number): boolean {
        if (!before || !after) {
            return false;
        }
        const adjustedBefore = new Date(before.getTime() + 60000 * minutes);
        return adjustedBefore >= after;
    }

    connect(contactId: string) {
        this.messages = [];
        this.unsubscribe();
        this.activeContactOrChannel = contactId;
        this.activeChannel =
            this.me.id < contactId
                ? `${this.me.id}_${contactId}`
                : `${contactId}_${this.me.id}`;
        this.them = this.contacts.find(c => c.id === contactId);
        this.getMessages$ = this.messageService
            .getMessages(this.activeChannel, this.me)
            .subscribe(messages => {
                this.messages = this.processPlacements(messages);
                this.scrollToBottom();
                this.messageService.read(this.activeChannel, this.me.id);
            });
        this.messageService.createIMChannel(
            this.activeChannel,
            this.me,
            this.them
        );
        this.getChannelData$ = this.messageService
            .getChannelData(this.activeChannel)
            .subscribe();
        this.isNotWriting$ = this.newMessageWritingSubject
            .asObservable()
            .pipe(debounceTime(1500))
            .subscribe(() => {
                this.messageService.setIsNotWriting(
                    this.me,
                    this.activeChannel
                );
            });
        this.isWriting$ = this.newMessageWritingSubject
            .asObservable()
            .pipe(throttleTime(1000))
            .subscribe(() => {
                this.messageService.setIsWriting(this.me, this.activeChannel);
            });
        this.getWritingMembers$ = this.messageService
            .getWritingMembersInChannel(this.activeChannel)
            .subscribe(contacts => {
                this.writingContacts = contacts
                    .filter(c => c.id !== this.me.id)
                    .map(c => c.name);
            });
        this.scrollTop$ = this.scrolledTopSubject
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

    toDate(seconds: number) {
        const date = new Date();
        date.setSeconds(seconds);
        return date;
    }

    become(contact: Contact) {
        this.me = contact;
        this.channelLoaded = false;
        this.messageService.getMyChannelsInfo(this.me).subscribe(channels => {
            if (!channels.length) {
                this.channelLoaded = true;
            }
            combineLatest(
                channels.map(c => this.messageService.getChannelData(c.id))
            ).subscribe(results => {
                this.channelLoaded = true;
                const channelInfos = results
                    .map((c, i) => ({
                        ...c,
                        lastRead: channels[i].lastRead
                            ? this.toDate(channels[i].lastRead.seconds)
                            : undefined
                    }))
                    .map(c =>
                        c.type === 'IM'
                            ? {
                                  ...c,
                                  name: (c as any)[
                                      `${this.me.id}_name`
                                  ] as string,
                                  id: (c as any)[this.me.id] as string,
                                  lastMessageSent: c.lastMessageSent
                                      ? this.toDate(
                                            ((c as any).lastMessageSent as any)
                                                .seconds
                                        )
                                      : undefined
                              }
                            : c
                    );
                this.myChannels = channelInfos
                    .sort(c =>
                        c.lastMessageSent ? c.lastMessageSent.getTime() : 0
                    )
                    .reverse();
                this.myFilteredChannels = this.myChannels.slice();
                const myChannelIds = this.myChannels.map(c => c.id);
                this.unaddedContacts = this.contacts.filter(
                    c => c.id !== this.me.id && !myChannelIds.includes(c.id)
                );
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
        this.loading = true;
        this.messageService
            .uploadFile(this.me, this.activeChannel, ev.target.files[0])
            .subscribe(() => {
                this.loading = false;
            });
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

    logOut() {
        this.authService.logOut();
        this.router.navigate(['/sign-in']);
    }

    addEmoji(emoji: any) {
        const native = emoji.emoji.native;
        insertAtCaret('newMessage', native);
    }

    private scrollToBottom() {
        setTimeout(() => {
            const container = this.messageContainer.nativeElement;
            container.scrollTop = this.getContainerScrollHeight();
        }, 0);
    }
}
