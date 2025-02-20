
class AppWindow extends HTMLElement {

    static {
        (new CSSStyleSheet())
            .replace(`
                *,
                *::after,
                *::before {
                    margin: 0;
                    box-sizing: border-box;
                }
            `)
            .then((sheet) => document.adoptedStyleSheets = [sheet]);
    }

    constructor() {
        super()
    }

    connectedCallback() {
        const style = document.createElement('style');
        style.textContent = `
            :host {
                border: 5px solid red;
                position: fixed;
                inset: 0;
            }
        `; // End of style

        this.attachShadow({ mode: "open" })
            .append(style, document.createElement('slot'));
    }
}
customElements.define("app-window", AppWindow);


class AppRibbonBar extends HTMLElement {
    
    constructor() {
        super()
    }

    connectedCallback() {
        const style = document.createElement('style');
        style.textContent = `
            :host {
                border: 5px solid red;
                position: fixed;
                inset: 0;
            }
        `; // End of style

        this.attachShadow({ mode: "open" })
            .append(style, document.createElement('slot'));
    }
}
customElements.define("app-ribbon-bar", AppRibbonBar);