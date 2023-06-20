import { CryptoTasks, Password } from './Crypto.js';
import { buildLink, copyToClipboard, hideUnhide, openLink, selectOnFocus } from './Ui.js';

document.addEventListener('DOMContentLoaded', async () => {
    const passwordInput = document.getElementById('password');
    const passwordHideButton = document.getElementById('password-hide');
    const passwordCopyButton = document.getElementById('password-copy');
    const linkInput = document.getElementById('link');
    const linkCopyButton = document.getElementById('link-copy');
    const linkOpenButton = document.getElementById('link-open');

    selectOnFocus(passwordInput);
    hideUnhide(passwordInput, passwordHideButton);
    copyToClipboard(passwordInput, passwordCopyButton);

    selectOnFocus(linkInput);
    copyToClipboard(linkInput, linkCopyButton);
    openLink(linkInput, linkOpenButton);

    const password = Password.generate(16);
    const letter = await CryptoTasks.generateKey(password);

    passwordInput.value = password;
    linkInput.value = buildLink('write-letter.html', letter);
});
