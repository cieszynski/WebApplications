class AppWindow extends HTMLElement {

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

customElements.define("app-window", AppWindow)