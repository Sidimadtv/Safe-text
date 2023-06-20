import { CryptoTasks } from './Crypto.js';
import { buildLink, goTo, hideUnhide, popHash } from './Ui.js';

document.addEventListener('DOMContentLoaded', async () => {
    const passwordInput = document.getElementById('password');
    const passwordHideButton = document.getElementById('password-hide');

    const letterInput = document.getElementById('letter');
    const letterUnlockButton = document.getElementById('letter-unlock');

    const payload = popHash();

    if (!payload) {
        goTo(buildLink('index.html'), false);
    }

    hideUnhide(passwordInput, passwordHideButton);

    letterUnlockButton.addEventListener('pointerup', async () => {
        letterInput.value = await CryptoTasks.decrypt(payload, passwordInput.value);
    });
});
