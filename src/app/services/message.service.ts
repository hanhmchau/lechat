import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    AngularFirestore,
    AngularFirestoreCollection,
    DocumentReference,
    DocumentChangeAction,
    Action,
    DocumentSnapshot
} from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';
import { Observable, of, Observer } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import Message from '../models/message';
import Channel from '../models/channel';
import Contact from '../models/contact';
import Preview from '../models/preview';
import * as firebase from 'firebase';

@Injectable({
    providedIn: 'root'
})
export class MessageService {
    private channelCollectionRef: AngularFirestoreCollection<Message>;
    private contactCollectionRef: AngularFirestoreCollection<Contact>;

    constructor(
        private http: HttpClient,
        private db: AngularFirestore,
        private afStorage: AngularFireStorage
    ) {
        this.channelCollectionRef = db.collection('channels');
        this.contactCollectionRef = db.collection('contacts');
    }

    getUrlPreview(url: string): Observable<Preview> {
        const key = '5c0555fa5b015f1dc455e50d6446d285982d5296004e2';
        return this.http.get<Preview>(
            `http://api.linkpreview.net/?key=${key}&q=${url}`
        );
    }

    createChannel(id: string, name: string, contacts: Contact[]) {
        const memberCol = this.channelCollectionRef
            .doc(id)
            .collection('members');
        contacts.forEach(cont => {
            this.contactCollectionRef
                .doc(cont.id)
                .collection<Channel>('channels')
                .doc(id)
                .set(
                    {
                        id,
                        name
                    },
                    {
                        merge: true
                    }
                );
            memberCol.doc(cont.id).set(cont);
        });
    }

    createIMChannel(id: string, me: Contact, otherSide: Contact) {
        const channel = this.channelCollectionRef.doc(id);
        const meName = `${me.id}_name`;
        const otherName = `${otherSide.id}_name`;
        channel.set(
            {
                [me.id]: otherSide.id,
                [meName]: otherSide.name,
                [otherSide.id]: me.id,
                [otherName]: me.name,
                type: 'IM'
            },
            {
                merge: true
            }
        );
        this.contactCollectionRef
            .doc(me.id)
            .collection<Channel>('channels')
            .doc(id)
            .set(
                {
                    id,
                    type: 'IM'
                },
                {
                    merge: true
                }
            );
        this.contactCollectionRef
            .doc(otherSide.id)
            .collection<Channel>('channels')
            .doc(id)
            .set(
                {
                    id,
                    type: 'IM'
                },
                {
                    merge: true
                }
            );
    }

    sendFirstMessage(message: Message, channel: string, contacts: Contact[]) {
        this.sendMessage(message, channel).subscribe();
        const me = message.sender;
        const otherSide = contacts.filter(c => c.id !== message.sender.id)[0];
        // this.createIMChannel(channel, me, otherSide);
    }

    sendMessage(message: Message, channel: string): Observable<string> {
        return Observable.create((observer: Observer<string>) => {
            const channelObj = this.channelCollectionRef.doc(channel);
            const now = new Date();
            channelObj
                .collection<Message>('messages')
                .add({
                    ...message,
                    timestamp: now
                })
                .then((val: DocumentReference) => {
                    observer.next(val.id);
                });
            channelObj.set(
                {
                    lastMessageSent: now
                },
                {
                    merge: true
                }
            );
        });
    }

    deleteMessage(id: string, channel: string) {
        this.channelCollectionRef
            .doc(channel)
            .collection<Message>('messages')
            .doc(id)
            .delete();
    }

    updateMessage(message: Message, channel: string) {
        message.edited = true;
        this.channelCollectionRef
            .doc(channel)
            .collection<Message>('messages')
            .doc(message.id)
            .set(message);
    }

    getContacts(): Observable<Contact[]> {
        return this.contactCollectionRef
            .snapshotChanges()
            .pipe(this.mapDocToData<Contact>());
    }

    getMessages(
        channel: string,
        sender: Contact,
        before?: Message,
        limit: number = 10
    ): Observable<Message[]> {
        const filter = before
            ? (ref: firebase.firestore.CollectionReference) =>
                  ref
                      .orderBy('timestamp', 'desc')
                      .startAfter(before.timestamp)
                      .limit(limit)
            : (ref: firebase.firestore.CollectionReference) =>
                  ref.orderBy('timestamp', 'desc').limit(limit);
        this.contactCollectionRef
            .doc(sender.id)
            .collection('channels')
            .doc(channel)
            .set(
                {
                    lastRead: new Date()
                },
                {
                    merge: true
                }
            );
        return this.channelCollectionRef
            .doc(channel)
            .collection('messages', filter)
            .snapshotChanges()
            .pipe(
                this.mapDocToData<Message>(),
                map(messages => messages.reverse()),
                map(messages =>
                    messages.map(msg => ({
                        ...msg,
                        timestamp: (msg.timestamp as any).toDate()
                    }))
                )
            );
    }

    getMyChannelsInfo(me: Contact): Observable<any[]> {
        return this.contactCollectionRef
            .doc(me.id)
            .collection('channels')
            .snapshotChanges()
            .pipe(
                map(val =>
                    val.map(v => ({
                        ...v.payload.doc.data(),
                        id: v.payload.doc.id
                    }))
                )
            );
    }

    getChannelData(channel: string): Observable<Channel> {
        return this.channelCollectionRef
            .doc(channel)
            .snapshotChanges()
            .pipe(
                map((value: Action<DocumentSnapshot<Channel>>) => ({
                    ...value.payload.data(),
                    id: channel
                }))
            );
    }

    getWritingMembersInChannel(channel: string): Observable<Contact[]> {
        return this.channelCollectionRef
            .doc(channel)
            .collection('isWriting')
            .snapshotChanges()
            .pipe(this.mapDocToData<Contact>());
    }

    setIsWriting(sender: Contact, channel: string) {
        this.channelCollectionRef
            .doc(channel)
            .collection('isWriting')
            .doc(sender.id)
            .set({
                name: sender.name
            });
    }

    setIsNotWriting(sender: Contact, channel: string) {
        this.channelCollectionRef
            .doc(channel)
            .collection('isWriting')
            .doc(sender.id)
            .delete();
    }

    uploadFile(sender: Contact, channel: string, file: File) {
        // The storage path
        const path = `${channel}/${new Date().getTime()}_${file.name}`;

        // Totally optional metadata
        const customMetadata = { name: file.name };

        // The main task
        const task = this.afStorage
            .upload(path, file, { customMetadata })
            .then(snapshot => snapshot.ref.getDownloadURL())
            .then(downloadUrl => {
                this.sendMessage(
                    {
                        content: '',
                        sender,
                        attachment: {
                            name: file.name,
                            size: file.size,
                            downloadUrl
                        }
                    },
                    channel
                ).subscribe();
            });
    }

    generateContacts() {
        const names = ['Stubbs', 'Rooney', 'Herring', 'Bowen', 'Sullivan'];
        names.forEach(name => {
            this.contactCollectionRef.add({
                name,
                isOnline: true
            });
        });
    }

    private getServerTimestamp() {
        return firebase.firestore.FieldValue.serverTimestamp();
    }

    private mapDocToData<T>() {
        return map(
            (
                items: Array<
                    DocumentChangeAction<firebase.firestore.DocumentData>
                >
            ) =>
                items.map(doc => {
                    // tslint:disable-next-line:no-object-literal-type-assertion
                    return ({
                        ...doc.payload.doc.data(),
                        id: doc.payload.doc.id
                    } as unknown) as T;
                })
        );
    }
}
