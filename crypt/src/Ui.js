export const selectOnFocus = (input) => {
    input.addEventListener('focus', () => {
        input.select();
    });

    input.addEventListener('pointerup', (e) => {
        e.preventDefault();
    });
};

export const hideUnhide = (input, button) => {
    const iconI = button.getElementsByTagName('i').item(0);

    if (iconI) {
        let visible = iconI.classList.contains('icon-eye');

        button.addEventListener('pointerup', () => {
            visible = !visible;
            if (visible) {
                iconI.classList.add('icon-eye');
                iconI.classList.remove('icon-eye-blocked');
                input.type = 'text';
            } else {
                iconI.classList.add('icon-eye-blocked');
                iconI.classList.remove('icon-eye');
                input.type = 'password';
            }
        });
    }
};

export const copyToClipboard = (input, button) => {
    button.addEventListener('pointerup', async () => {
        await navigator.clipboard.writeText(input.value);
    });
};

export const goTo = (url, history = true) => {
    if (history) {
        location.assign(url);
    } else {
        location.replace(url);
    }
};

export const openLink = (input, button) => {
    button.addEventListener('pointerup', () => {
        goTo(input.value);
    });
};

export const buildLink = (html, hash) => {
    return `${location.origin}${location.pathname.split('/').slice(0, -1).join('/')}/${html}${hash ? '#' + hash : ''}`;
};

export const popHash = () => {
    const { hash } = location;

    location.hash = '';

    return hash.replace(/^#/, '');
};
