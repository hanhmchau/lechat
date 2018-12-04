import { BasicEmojiPipe } from './pipes/basic-emoji.pipe';
import { EmojifyPipe } from './pipes/emojify.pipe';
import { PrettyBytesPipe } from './pipes/pretty-bytes.pipe';
import { JdenticonHashDirective } from './directives/jdenticon-hash.directive';
import { AngularFirestore } from '@angular/fire/firestore';
import { MessageService } from './services/message.service';
import { ChatContainerComponent } from './chat-container/chat-container.component';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgSelectModule } from '@ng-select/ng-select';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MessageComponent } from './message/message.component';
import { MaterialModule } from './material.module';
import { NotFoundComponent } from './not-found/not-found.component';
import { RoutingService } from './routing.service';
import { AngularFireModule } from '@angular/fire';
import { AngularFireDatabaseModule } from '@angular/fire/database';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { NgxLinkifyjsModule } from 'ngx-linkifyjs';
import { MarkdownModule } from 'ngx-markdown';
import { Ng2EmojiModule } from 'ng2-emoji';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { ScrollEventModule } from 'ngx-scroll-event';

const config = {
    apiKey: 'AIzaSyAqygACZQfcFvVg9XpDUZ2QiB0aRQEN1tA',
    authDomain: 'lechat-3ef2e.firebaseapp.com',
    databaseURL: 'https://lechat-3ef2e.firebaseio.com',
    projectId: 'lechat-3ef2e',
    storageBucket: 'lechat-3ef2e.appspot.com',
    messagingSenderId: '437798835422'
};

@NgModule({
    declarations: [
        // add components here
        AppComponent,
        MessageComponent,
        NotFoundComponent,
        ChatContainerComponent,
        BasicEmojiPipe,
        EmojifyPipe,
        PrettyBytesPipe,
        JdenticonHashDirective
    ],
    imports: [
        BrowserModule,
        FormsModule,
        ReactiveFormsModule,
        NgSelectModule,
        HttpClientModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        MaterialModule,
        FlexLayoutModule,
        AngularFireModule.initializeApp(config),
        AngularFireDatabaseModule,
        AngularFireStorageModule,
        NgxLinkifyjsModule.forRoot(),
        MarkdownModule.forRoot(),
        Ng2EmojiModule.forRoot(),
        InfiniteScrollModule,
        ScrollEventModule
    ],
    exports: [],
    providers: [
        RoutingService,
        MessageService,
        AngularFirestore
        // add injectable things here
    ],
    bootstrap: [AppComponent]
})
export class AppModule {}
