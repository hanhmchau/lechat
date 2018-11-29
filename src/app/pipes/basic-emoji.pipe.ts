import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'basicEmoji' })
export class BasicEmojiPipe implements PipeTransform {
    private plainEmojiMap: any = {
        ':)': ':smile:',
        ':(': ':disappointed:',
        ':O': ':open_mouth:',
        ':D': ':laughing:',
        ':P': ':stuck_out_tongue:',
        ':*': ':kissing_heart:',
        ';)': ':wink:',
        // tslint:disable-next-line:quotemark
        ":'(": ':cry:'
    };

    transform(value: string): string {
        return value.replace(this.getRegex(), matched =>
            this.plainEmojiMap[matched]
        );
    }

    private getRegex() {
        const keys = Object.keys(this.plainEmojiMap)
            .map(key => `(${this.escapeRegExp(key)})`)
            .join('|');
        const lookahead = '(?=([\\s\\.\\!\\>\\<,$])|$)';
        const reg = `(${keys})${lookahead}`;
        return new RegExp(reg, 'gi');
    }

    private escapeRegExp(str: string) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }
}
