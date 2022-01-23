
export class CachedJSONData {
    private filename: string;
    private data: {[index: string]: {[index: string]: string|object}|string|string[]};

    constructor(url: string, callback: (data: CachedJSONData) => void) {
        this.filename = url.substring(url.lastIndexOf('/') + 1);
        this.data = JSON.parse(window.localStorage.getItem(this.filename));

        if (this.data !== null) {
            callback(this);
        } else {
            (async () => {
                await fetch(url).then(v => {
                    v.text().then(text => {
                        this.data = JSON.parse(text);
                        window.localStorage.setItem(this.filename, text);
                        callback(this);
                    });
                });
            })();
        }
    }

    public getStringByKey(key: string): string {
        return this.data[key] as string;
    }

    public getArrayByKey(key: string): string[] {
        return this.data[key] as string[];
    }

    public getObjectByKey(key: string): {[index: string]: string|object}|null {
        try {
            return this.data[key] as {};
        } catch {
            return null;
        }
    }

    public addObject(key: string, object: {[index: string]: string|object}) {
        this.data[key] = object;
    }

    public save() {
        window.localStorage.setItem(this.filename, JSON.stringify(this.data));
    }
}