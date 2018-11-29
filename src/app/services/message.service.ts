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

    sendMessage(message: Message, channel: string): Observable<string> {
        return Observable.create((observer: Observer<string>) => {
            const channelObj = this.channelCollectionRef.doc(channel);
            channelObj
                .collection<Message>('messages')
                .add({
                    ...message,
                    timestamp: new Date()
                })
                .then((val: DocumentReference) => {
                    observer.next(val.id);
                });
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

    getMessages(channel: string): Observable<Message[]> {
        return this.channelCollectionRef
            .doc(channel)
            .collection('messages', ref =>
                ref.orderBy('timestamp', 'desc').limit(10)
            )
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

    getChannelData(channel: string): Observable<Channel> {
        return this.channelCollectionRef
            .doc(channel)
            .snapshotChanges()
            .pipe(
                map((value: Action<DocumentSnapshot<Channel>>) =>
                    value.payload.data()
                )
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
