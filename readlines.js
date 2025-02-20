// https://gchristensen.github.io/posts/readline-in-es6/

class ReadLine {

    constructor(file) {
        this.file = file;
        this.offset = 0;
        this.decoder = new TextDecoder();
        this.reader = new FileReader();
    }

    async *lines() {
        let remnantBytes = null;
        let remnantCharacters = "";

        for (let offset = 0; offset < this.file.size; offset += 1024) {
            const chunk = await this.readChunk(offset);
            let uint8 = new Uint8Array(chunk);
            let index = uint8.length - 1;
            let split = false;
            let remnant = null;

            // check if we landed not at the beginning of an UTF-8 character sequence
            if ((uint8[index] & 0b11000000) === 0b11000000) {
                split = true;
            } else {
                while (index && (uint8[index] & 0b11000000) === 0b10000000) {
                    index -= 1;
                }

                if (index !== uint8.length - 1) {
                    split = true;
                }
            }

            if (split) { // Yes, we landed not at the beginning
                // save remnant bytes
                remnant = uint8.slice(index);
                uint8 = uint8.slice(0, index);

                if (remnantBytes) {
                    const newBytes = new Uint8Array(remnantBytes.length + uint8.length);
                    newBytes.set(remnantBytes);
                    newBytes.set(uint8, remnantBytes.length);
                    uint8 = newBytes;
                }

                remnantBytes = remnant;
            }
            else {
                // use remnant bytes from the previous chunk to complete the line
                if (remnantBytes) {
                    const newBytes = new Uint8Array(remnantBytes.length + uint8.length);
                    newBytes.set(remnantBytes);
                    newBytes.set(uint8, remnantBytes.length);
                    uint8 = newBytes;
                }

                remnantBytes = null;
            }

            // convert bytes to text
            let lines = this.decoder.decode(uint8).split("\n");

            if (lines.length === 1) { // save characters of incomplete line
                remnantCharacters += lines[0];
            } else if (lines.length) {
                // use remnant characters from the previous chunk
                if (remnantCharacters) {
                    lines[0] = remnantCharacters + lines[0];
                }

                remnantCharacters = lines[lines.length - 1];
                lines.length -= 1;

                // return obtained lines through yield delegation
                yield* lines;
            }
        }

        yield remnantCharacters;
    }

    readChunk(offset) {
        return new Promise((resolve, reject) => {
            this.reader.onloadend = () => {
                resolve(this.reader.result);
            };
            this.reader.onerror = (err) => {
                reject(err);
            };

            const chunk = this.file.slice(offset, offset + 1024);
            this.reader.readAsArrayBuffer(chunk);
        });
    }
}