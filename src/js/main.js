import { $on } from "./util";
import DocReady from "./windowLoaded";
import { initEbook } from './app';



DocReady(() => {
    console.log('MAIN: initEbook: ', initEbook);
    const app = initEbook();
    console.log('MAIN: app: ', app);
    const loadHandler = () => app.init('slides.html', '.js-wrapper');
    $on(window, "load", loadHandler.bind(app));
});