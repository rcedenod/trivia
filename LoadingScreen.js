export default class LoadingScreen {
    constructor(message = 'Cargando...') {
        this.message = message;
        this.screen = null;
    }

    render() {
        if(!this.screen) {
            const container = document.createElement('div');
            container.classList.add("loading-screen");

            const spinner = document.createElement('div');
            spinner.classList.add("spinner");
            container.appendChild(spinner);

            const message = document.createElement('p');
            message.textContent = this.message;
            container.appendChild(message)

            this.screen = container;
        }
        
        return this.screen;
    }

    show() {
        if (this.screen) {
            this.screen.style.display = 'flex';
        } 
    }

    hide() {
        if (this.screen) {
            this.screen.style.display = 'none';
        }
            
    }
}