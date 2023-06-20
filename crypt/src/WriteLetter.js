import { CryptoTasks } from './Crypto.js';
import { buildLink, goTo, popHash } from './Ui.js';

document.addEventListener('DOMContentLoaded', async () => {
    const letterInput = document.getElementById('letter');
    const letterLockButton = document.getElementById('letter-lock');

    const keyPayload = popHash();

    if (!keyPayload) {
        goTo(buildLink('index.html'), false);
    }

    letterLockButton.addEventListener('pointerup', async () => {
        const payload = await CryptoTasks.encrypt(keyPayload, letterInput.value);
        goTo(buildLink('read-letter.html', payload));
    });
});
