const ArrayBufferToUrlSafeBase64 = {
    _encodings: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',

    _charCodeToNumber(charCode) {
        if (charCode >= 65 && charCode <= 90) {
            return charCode - 65;
        } else if (charCode >= 97 && charCode <= 122) {
            return charCode - 71;
        } else if (charCode >= 48 && charCode <= 57) {
            return charCode + 4;
        } else if (charCode === 45) {
            return 62;
        } else if (charCode === 95) {
            return 63;
        } else {
            throw new Error('Invalid char code in url safe base64: ' + charCode);
        }
    },

    encode(arrayBuffer) {
        const encodings = this._encodings;

        let base64 = '';

        const bytes = new Uint8Array(arrayBuffer);
        const byteLength = bytes.byteLength;
        const byteRemainder = byteLength % 3;
        const mainLength = byteLength - byteRemainder;

        let a, b, c, d;
        let chunk;

        // Main loop deals with bytes in chunks of 3
        for (let i = 0; i < mainLength; i = i + 3) {
            // Combine the three bytes into a single integer
            chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

            // Use bitmasks to extract 6-bit segments from the triplet
            // 16515072 = (2^6 - 1) << 18
            a = (chunk & 16515072) >> 18;
            // 258048   = (2^6 - 1) << 12
            b = (chunk & 258048) >> 12;
            // 4032     = (2^6 - 1) << 6
            c = (chunk & 4032) >> 6;
            // 63       = 2^6 - 1
            d = chunk & 63;

            // Convert the raw binary segments to the appropriate ASCII encoding
            base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
        }

        // Deal with the remaining bytes and padding
        if (byteRemainder === 1) {
            chunk = bytes[mainLength];

            // 252 = (2^6 - 1) << 2
            a = (chunk & 252) >> 2;

            // Set the 4 least significant bits to zero
            // 3   = 2^2 - 1
            b = (chunk & 3) << 4;

            // + '=='
            base64 += encodings[a] + encodings[b];
        } else if (byteRemainder === 2) {
            chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

            // 64512 = (2^6 - 1) << 10
            a = (chunk & 64512) >> 10;

            // 1008  = (2^6 - 1) << 4
            b = (chunk & 1008) >> 4;

            // Set the 2 least significant bits to zero
            // 15    = 2^4 - 1
            c = (chunk & 15) << 2;

            // + '='
            base64 += encodings[a] + encodings[b] + encodings[c];
        }

        return base64;
    },

    decode(str) {
        const mod4 = str.length % 4;

        let mainByteLength = 0;
        let mainStringLength = 0;
        let restByteLength = 0;

        if (mod4 === 0) {
            mainByteLength = (str.length / 4) * 3;
            mainStringLength = str.length;
        } else if (mod4 === 1) {
            throw new Error('invalid url safe base64 encoded string: ' + str);
        } else if (mod4 === 2) {
            mainByteLength = ((str.length - 2) / 4) * 3;
            mainStringLength = str.length - 2;
            restByteLength = 1;
        } else {
            mainByteLength = ((str.length - 3) / 4) * 3;
            mainStringLength = str.length - 3;
            restByteLength = 2;
        }

        // 3-byte chunk
        let chunk;
        const resultBuffer = new Uint8Array(mainByteLength + restByteLength);

        // process main string
        let a, b, c, d;
        for (let i = 0, j = 0; i < mainStringLength; i += 4, j += 3) {
            a = this._charCodeToNumber(str.charCodeAt(i));
            b = this._charCodeToNumber(str.charCodeAt(i + 1));
            c = this._charCodeToNumber(str.charCodeAt(i + 2));
            d = this._charCodeToNumber(str.charCodeAt(i + 3));
            chunk = (a << 18) + (b << 12) + (c << 6) + d;
            resultBuffer.set([(chunk & 0xff0000) >> 16, (chunk & 0x00ff00) >> 8, chunk & 0x0000ff], j);
        }

        // process rest string
        if (mod4 === 2) {
            // 1 byte remain
            a = this._charCodeToNumber(str.charCodeAt(mainStringLength));
            b = this._charCodeToNumber(str.charCodeAt(mainStringLength + 1));
            chunk = (a << 2) + (b >> 4);
            resultBuffer.set([chunk & 0xff], mainByteLength);
        } else if (mod4 === 3) {
            // 2 bytes remain
            a = this._charCodeToNumber(str.charCodeAt(mainStringLength));
            b = this._charCodeToNumber(str.charCodeAt(mainStringLength + 1));
            c = this._charCodeToNumber(str.charCodeAt(mainStringLength + 2));
            chunk = (a << 10) + (b << 4) + (c >> 2);
            resultBuffer.set([(chunk & 0xff00) >> 8, chunk & 0x00ff], mainByteLength);
        }

        return resultBuffer.buffer;
    },
};

export const Password = {
    _0: '0'.charCodeAt(0),
    _9: '9'.charCodeAt(0),
    _A: 'A'.charCodeAt(0),
    _Z: 'Z'.charCodeAt(0),
    _a: 'a'.charCodeAt(0),
    _z: 'z'.charCodeAt(0),
    _special: ['!', '#', '%'].map((e) => e.charCodeAt(0)).sort(),
    _buffer: new Uint8Array(255),

    _countChars(buffer, start, end, maxSpecial) {
        let [numDigits, numUppercase, numLowecase, numSpecial, firstSpecial, jump] = [0, 0, 0, 0, 0, 0];

        for (let i = start; i <= end; i++) {
            const code = buffer[i];

            if (code >= this._0 && code <= this._9) {
                numDigits++;
            } else if (code >= this._A && code <= this._Z) {
                numUppercase++;
            } else if (code >= this._a && code <= this._z) {
                numLowecase++;
            } else {
                if (!firstSpecial) {
                    firstSpecial = i;
                }

                if (++numSpecial > maxSpecial) {
                    jump = firstSpecial - start;
                    break;
                }
            }
        }

        return [numDigits, numUppercase, numLowecase, numSpecial, jump];
    },

    _decode(buffer, start, end) {
        let password = '';

        for (let i = start; i <= end; i++) {
            password += String.fromCharCode(buffer[i]);
        }

        return password;
    },

    generate(length) {
        let password = '';

        while (!password) {
            crypto.getRandomValues(this._buffer);

            const buffer = this._buffer.filter(
                (e) =>
                    (e >= this._0 && e <= this._9) ||
                    (e >= this._A && e <= this._Z) ||
                    (e >= this._a && e <= this._z) ||
                    this._special.includes(e),
            );

            let start = 0;
            let end = start + length - 1;

            for (; end < buffer.length; start++, end++) {
                const startsEndsWithDigitOrSpecial = [buffer[start], buffer[end]].some(
                    (e) => (e >= this._0 && e <= this._9) || this._special.includes(e),
                );

                if (startsEndsWithDigitOrSpecial) {
                    continue;
                }

                const [numDigits, numUppercase, numLowecase, numSpecial, jump] = this._countChars(buffer, start, end, 2);

                if (jump) {
                    start += jump;
                    end += jump;
                    continue;
                }

                if (!(numDigits && numUppercase && numLowecase && numSpecial)) {
                    continue;
                }

                password = this._decode(buffer, start, end);
                break;
            }
        }

        return password;
    },
};

export const CryptoTasks = {
    ERROR_WRONG_PASSWORD: 1000,

    _pbkdf2Params: {
        name: 'PBKDF2',
        hash: 'SHA-512',
    },

    _aesKeyGenParams: {
        name: 'AES-GCM',
        length: 256,
    },

    _aesGcmParams: {
        name: 'AES-GCM',
    },

    _ecKeyGenParams: {
        name: 'ECDH',
        namedCurve: 'P-521',
    },

    _ecdhKeyDeriveParams: {
        name: 'ECDH',
    },

    _enc: new TextEncoder(),
    _dec: new TextDecoder(),

    _generateSalt() {
        // 256 bits
        return crypto.getRandomValues(new Uint8Array(32));
    },

    _generateIterations() {
        const iterations = crypto.getRandomValues(new Uint32Array(1));

        iterations[0] = 100000 + Math.round((50000.0 / 4294967295.0) * iterations[0]);

        return iterations;
    },

    _generateIv() {
        // 96 bits
        return crypto.getRandomValues(new Uint8Array(12));
    },

    async generateKey(password) {
        const passwordEncoded = this._enc.encode(password);
        const keyData = await crypto.subtle.digest('SHA-256', passwordEncoded);
        const baseKey = await crypto.subtle.importKey('raw', keyData, this._pbkdf2Params.name, false, ['deriveKey']);

        const salt = this._generateSalt();
        const saltB64 = ArrayBufferToUrlSafeBase64.encode(salt.buffer);
        const iterations = this._generateIterations();
        const iterationsB64 = ArrayBufferToUrlSafeBase64.encode(iterations.buffer);

        const wrappingKey = await crypto.subtle.deriveKey(
            {
                ...this._pbkdf2Params,
                salt,
                iterations: iterations[0],
            },
            baseKey,
            this._aesKeyGenParams,
            false,
            ['wrapKey'],
        );

        const { publicKey, privateKey } = await crypto.subtle.generateKey(this._ecKeyGenParams, true, ['deriveKey']);
        const publicKeyExported = await crypto.subtle.exportKey('raw', publicKey);
        const publicKeyB64 = ArrayBufferToUrlSafeBase64.encode(publicKeyExported);

        const iv = this._generateIv();
        const ivB64 = ArrayBufferToUrlSafeBase64.encode(iv.buffer);
        const privateKeyWrapped = await crypto.subtle.wrapKey('pkcs8', privateKey, wrappingKey, {
            ...this._aesGcmParams,
            iv,
        });

        const privateKeyB64 = ArrayBufferToUrlSafeBase64.encode(privateKeyWrapped);

        return [saltB64, iterationsB64, ivB64, privateKeyB64, publicKeyB64].join('.');
    },

    async encrypt(keyPayload, plaintext) {
        const [saltB64, iterationsB64, ivB64, privateKeyB64, publicKeyB64] = keyPayload.split('.');

        const plaintextEncoded = this._enc.encode(plaintext);

        const publicKeyExported = ArrayBufferToUrlSafeBase64.decode(publicKeyB64);
        const publicKey = await crypto.subtle.importKey('raw', publicKeyExported, this._ecKeyGenParams, false, []);

        const { publicKey: publicKeyD, privateKey: privateKeyD } = await crypto.subtle.generateKey(this._ecKeyGenParams, false, [
            'deriveKey',
        ]);
        const publicKeyDExported = await crypto.subtle.exportKey('raw', publicKeyD);
        const publicKeyDB64 = ArrayBufferToUrlSafeBase64.encode(publicKeyDExported);

        const masterKey = await crypto.subtle.deriveKey(
            {
                ...this._ecdhKeyDeriveParams,
                public: publicKey,
            },
            privateKeyD,
            this._aesKeyGenParams,
            false,
            ['encrypt'],
        );

        const ivD = this._generateIv();
        const ivDB64 = ArrayBufferToUrlSafeBase64.encode(ivD.buffer);
        const ciphertext = await crypto.subtle.encrypt(
            {
                ...this._aesGcmParams,
                iv: ivD,
            },
            masterKey,
            plaintextEncoded,
        );

        const ciphertextB64 = ArrayBufferToUrlSafeBase64.encode(ciphertext);

        return [saltB64, iterationsB64, ivB64, privateKeyB64, publicKeyDB64, ivDB64, ciphertextB64].join('.');
    },

    async decrypt(payload, password) {
        const [saltB64, iterationsB64, ivB64, privateKeyB64, publicKeyDB64, ivDB64, ciphertextB64] = payload.split('.');

        const passwordEncoded = this._enc.encode(password);
        const keyData = await crypto.subtle.digest('SHA-256', passwordEncoded);
        const baseKey = await crypto.subtle.importKey('raw', keyData, this._pbkdf2Params.name, false, ['deriveKey']);

        const salt = ArrayBufferToUrlSafeBase64.decode(saltB64);
        const iterations = new Uint32Array(ArrayBufferToUrlSafeBase64.decode(iterationsB64));
        const iv = ArrayBufferToUrlSafeBase64.decode(ivB64);

        const wrappingKey = await crypto.subtle.deriveKey(
            {
                ...this._pbkdf2Params,
                salt,
                iterations: iterations[0],
            },
            baseKey,
            this._aesKeyGenParams,
            false,
            ['unwrapKey'],
        );

        const privateKeyWrapped = ArrayBufferToUrlSafeBase64.decode(privateKeyB64);
        const privateKey = await (async () => {
            try {
                return await crypto.subtle.unwrapKey(
                    'pkcs8',
                    privateKeyWrapped,
                    wrappingKey,
                    {
                        ...this._aesGcmParams,
                        iv,
                    },
                    this._ecKeyGenParams,
                    false,
                    ['deriveKey'],
                );
            } catch {
                throw this.ERROR_WRONG_PASSWORD;
            }
        })();

        const publicKeyDExported = ArrayBufferToUrlSafeBase64.decode(publicKeyDB64);
        const publicKeyD = await crypto.subtle.importKey('raw', publicKeyDExported, this._ecKeyGenParams, false, []);

        const masterKey = await crypto.subtle.deriveKey(
            {
                ...this._ecdhKeyDeriveParams,
                public: publicKeyD,
            },
            privateKey,
            this._aesKeyGenParams,
            false,
            ['decrypt'],
        );

        const ivD = ArrayBufferToUrlSafeBase64.decode(ivDB64);
        const ciphertext = ArrayBufferToUrlSafeBase64.decode(ciphertextB64);
        const plaintextEncoded = await crypto.subtle.decrypt(
            {
                ...this._aesGcmParams,
                iv: ivD,
            },
            masterKey,
            ciphertext,
        );

        const plaintext = this._dec.decode(plaintextEncoded);

        return plaintext;
    },
};

export const test = async () => {
    const password = 'Yq4IVl0#rlOn0iUE';
    const plaintext = 'Hello World!!';
    const keyPayload = await CryptoTasks.generateKey(password);
    const payload = await CryptoTasks.encrypt(keyPayload, plaintext);
    const newPlaintext = await CryptoTasks.decrypt(payload, password);
    return plaintext === newPlaintext;
};
