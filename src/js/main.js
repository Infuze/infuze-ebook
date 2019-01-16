import { $on } from "./util";
import DocReady from "./windowLoaded";
import App from './app';

DocReady(() => {
    console.log('APP: DocReady: ', DocReady);
    const app = new App();
    const loadHandler = () => App.init(app, 'slides.html', '.js-wrapper');
    $on(window, "load", loadHandler.bind(app));
});