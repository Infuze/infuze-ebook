import Ebook from '../build/js/app';
//import './scss/styles.scss';

console.log('Ebook: : ', Ebook);
const app = new Ebook();
console.log('app: : ', app);

function docReady(callback) {

    function completed() {
        document.removeEventListener("DOMContentLoaded", completed, false);
        window.removeEventListener("load", completed, false);
        callback()
    }

    //Events.on(document, 'DOMContentLoaded', completed)

    if (document.readyState === "complete") {
        // Handle it asynchronously to allow scripts the opportunity to delay ready
        setTimeout(callback)

    } else {

        // Use the handy event callback
        document.addEventListener("DOMContentLoaded", completed, false);

        // A fallback to window.onload, that will always work
        window.addEventListener("load", completed, false);
    }
}

docReady(() => {
    //const app = new App();

    //const loadHandler = () => App.init(app, 'slides.html', '.js-wrapper');
    //window.addEventListener("load", loadHandler.bind(App));
});