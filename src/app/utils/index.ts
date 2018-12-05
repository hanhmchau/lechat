export function updateMapWidth() {
    this.width = document.getElementById('table').offsetWidth;
    const agmMaps = document.getElementsByTagName('agm-map');
    const rows = document.getElementsByTagName('app-address');
    const inputs = document.getElementsByClassName('autosuggest');
    for (
        let index = 0;
        index < document.getElementsByTagName('agm-map').length;
        index++
    ) {
        const el = agmMaps.item(index) as HTMLElement;
        const rowEl = rows.item(index) as HTMLElement;
        const input = inputs.item(index) as HTMLElement;
        el.style.width = `${this.width}px`;
        input.style.width = `${this.width / 2}px`;
        const bound = rowEl.getBoundingClientRect();
        el.style.top = input.style.top = `${bound.top +
            rowEl.offsetHeight +
            1}px`;
        el.style.left = input.style.left = `${bound.left}px`;
    }
}

export function insertAtCaret(areaId: string, text: string) {
    const txtarea = document.getElementById(areaId) as any;
    if (!txtarea) {
        return;
    }

    const scrollPos = txtarea.scrollTop;
    let strPos = 0;
    const br =
        txtarea.selectionStart || txtarea.selectionStart === '0'
            ? 'ff'
            : (document as any).selection
            ? 'ie'
            : false;
    if (br === 'ie') {
        txtarea.focus();
        const range = (document as any).selection.createRange();
        range.moveStart('character', -txtarea.value.length);
        strPos = range.text.length;
    } else if (br === 'ff') {
        strPos = txtarea.selectionStart;
    }

    const front = txtarea.value.substring(0, strPos);
    const back = txtarea.value.substring(strPos, txtarea.value.length);
    txtarea.value = front + text + back;
    strPos = strPos + text.length;
    if (br === 'ie') {
        txtarea.focus();
        const ieRange = (document as any).selection.createRange();
        ieRange.moveStart('character', -txtarea.value.length);
        ieRange.moveStart('character', strPos);
        ieRange.moveEnd('character', 0);
        ieRange.select();
    } else if (br === 'ff') {
        txtarea.selectionStart = strPos;
        txtarea.selectionEnd = strPos;
        txtarea.focus();
    }

    txtarea.scrollTop = scrollPos;
}
