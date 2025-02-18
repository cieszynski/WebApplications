customElements.define("app-ribbon-bar", class AppRibbonBar extends HTMLElement {

    constructor() {
        super()
    }

    connectedCallback() {
        const style = document.createElement('style');
        style.textContent = `
            :host {
                border: 5px solid green;
                position: relative;
                display: flex;
                height: 100px;
            }
        `; // End of style

        this.menu = document.createElement('menu');
        this.attachShadow({ mode: "open" })
            .append(style, document.createElement('slot'));

        this.addEventListener("click", (event) => {
            Array.from(this.children).forEach(element => {
                switch(event.target===element) {
                    case true:
                        element.setAttribute("active", true);
                        break;
                    default:
                        element.removeAttribute("active");
                }
            });
        })
    }
});

customElements.define("app-ribbon-tab", class AppRibbonTab extends HTMLElement {

    constructor() {
        super()
    }

    connectedCallback() {
        const style = document.createElement('style');
        style.textContent = `
            :host {
                display: block;
            }

            :host([active]) {
                background-color: yellow;
            }

            div {
                padding: 0 10px;
            }

            slot {
                display: none;
                background-color: yellow;
                position: absolute;
                inset: 20px 0 0 0;
            }

            :host([active]) slot {
                display: block;
            }
        `; // End of style

        const div = document.createElement('div');
        div.textContent = this.getAttribute('label')

        this.attachShadow({ mode: "open" })
            .append(style, div, document.createElement('slot'));
    }
});