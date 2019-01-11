export default class Navigation {
    constructor() {
        this.el = document.getElementsByClassName('nav-bar');
    };

    render(data) {
        this.el.innerHTML = calendar(data);
    };
}