// Web Serial API implementation for digital weighing scale

export class WeighingScaleService {
    private port: SerialPort | null = null;
    private reader: ReadableStreamDefaultReader | null = null;

    async connect(): Promise<boolean> {
        try {
            if (!('serial' in navigator)) {
                throw new Error('Web Serial API not supported in this browser.');
            }

            this.port = await navigator.serial.requestPort();
            await this.port.open({ baudRate: 9600 });
            return true;
        } catch (error) {
            console.error('Failed to connect to scale:', error);
            return false;
        }
    }

    async readWeight(onWeightUpdate: (weight: number) => void) {
        if (!this.port) throw new Error('Port not open');

        const textDecoder = new TextDecoderStream();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const readableStreamClosed = this.port.readable!.pipeTo(textDecoder.writable as any);
        this.reader = textDecoder.readable.getReader();

        try {
            let buffer = '';
            while (true) {
                const { value, done } = await this.reader.read();
                if (done) {
                    this.reader.releaseLock();
                    break;
                }
                if (value) {
                    buffer += value;
                    // Most scales send a newline ending line e.g. " 15.53 g \r\n"
                    const parts = buffer.split('\n');
                    if (parts.length > 1) {
                        const rawWeightStr = parts[0].replace(/[^\d.]/g, '');
                        const weight = parseFloat(rawWeightStr);
                        if (!isNaN(weight)) {
                            onWeightUpdate(weight);
                        }
                        buffer = parts.slice(1).join('\n');
                    }
                }
            }
        } catch (error) {
            console.error('Error reading from scale:', error);
        } finally {
            this.reader?.releaseLock();
        }
    }

    async disconnect() {
        if (this.reader) {
            await this.reader.cancel();
            this.reader.releaseLock();
        }
        if (this.port) {
            await this.port.close();
            this.port = null;
        }
    }
}

export const weighingScaleService = new WeighingScaleService();
