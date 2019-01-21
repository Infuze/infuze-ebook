import "babel-polyfill";
import { $on, qs } from './helpers';
import App from './q-app';
//import QuizMC from "./quizmc";

const app = new App();
const setApp = () => {
    app.startUp();
};

$on(window, 'load', setApp);
//$on(window, 'hashchange', setApp);
//$on(window, 'resize', quizApp.doResize);