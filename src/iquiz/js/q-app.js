//import "babel-polyfill";
import QuizMC from "./q-quizmc";
import QuizFT from "./q-freetext";
import Intro from "./q-intro";
import { $on, qs, $log } from "./helpers";
//import * as CryptoJS from "crypto-js";
import Event from 'events';

export default class App extends Event {
  //static instance;

  constructor() {
    super();
    //if (this.instance) {
    //  return instance;
    //}
    //this.instance = this;
    this.allQuestionNodes;
    this.questionInstances = [];
  }

  startUp() {
    $log("startUp");
    let screen;

    [...this.allQuestionNodes] = document.querySelectorAll("[data-iquiz]");

    this.allQuestionNodes.forEach(el => {
      let number = el.dataset.iquiz,
        type = el.dataset.type,
        params = el.dataset.params || {},
        answer = el.dataset.answer,
        state = el.dataset.state || [];

      if (typeof params === 'string') {
        params = String(params).replace(/\#/g, '\"');
        params = JSON.parse(params);
      }

      switch (type) {
        case "click-text-mc":
          screen = new QuizMC(el, {
            number,
            type,
            params,
            answer,
            state
          });
          this.questionInstances.push(screen);
          $on(screen, "nextQuestion", this.nextQuestion.bind(this));
          screen.startUp();
          break;
        case "freetext":
          screen = new QuizFT(el, {
            number,
            type,
            params,
            answer,
            state
          });
          this.questionInstances.push(screen);
          $on(screen, "nextQuestion", this.nextQuestion.bind(this));
          screen.startUp();
          break;
        case "intro":
          screen = new Intro(el, {
            number,
            type,
            params,
            answer,
            state
          });
          this.questionInstances.push(screen);
          $on(screen, "beginQuiz", this.beginQuiz.bind(this));
          break;
        case "results":
          //
          break;
      }
    });

    this.initialzeNavigation();
  }

  beginQuiz(e = null) {
    $log("beginQuiz", e);
    $log("beginQuiz", location.hash);

    //location.hash = "q23";

    //$log("beginQuiz", location.hash);
    //this.emit('beginQuiz', 'beginQuiz');
    this.emit('navigateToPage', 1);

    //this.navigateToPage(this.getPageNumber(1));
  }

  nextQuestion(e = null) {
    $log("nextQuestion", e);
    //$log("nextQuestion", this);
    //this.navigateToPage(this.getPageNumber(1));
    this.emit('navigateToNextPage', 1);
  }
  initialzeNavigation() {
    this.emit('initialzeNavigation', 'initialzeNavigation');
    if (qs(".js-nav-bar")) {
      //location.hash = location.hash || "#q1";
      //qs(".js-back").onclick = e => this.previousClick();
      //qs(".js-next").onclick = e => this.nextClick();
      //$on(window, "hashchange", this.hashChangedHandler.bind(this));
      //this.refreshPage();
      //this.setNavStates();
    }
  }

  hashChangedHandler(e) {
    $log("hashChangedHandler", e.target);
    this.refreshPage();
    this.setNavStates();
  }
  nextClick(e) {
    $log("nextClick", e);
    this.navigateToPage(this.getPageNumber(1));
  }
  previousClick(e) {
    $log("previousClick", e);
    this.navigateToPage(this.getPageNumber(-1));
  }
  refreshPage() {
    Array.from(document.querySelectorAll(".container--iquiz")).forEach(el => {
      el.classList.add("hidden");
    });
    $log("this.getPageNumber()", this.getPageNumber());
    const currentPageNode = qs(`[data-iquiz="${this.getPageNumber()}"]`);
    $log("currentPageNode", currentPageNode);
    if (currentPageNode) {
      currentPageNode.classList.remove("hidden");
    }
  }
  setNavStates() {
    let thisPageNode = qs(`[data-iquiz="${this.getPageNumber()}"]`),
      nextPageNode = qs(`[data-iquiz="${this.getPageNumber(1)}"]`),
      prevPageNode = qs(`[data-iquiz="${this.getPageNumber(-1)}"]`);

    if (prevPageNode) {
      enablePrevioust();
    } else {
      disablePrevious();
    }
    if (nextPageNode) {
      enableNext();
    } else {
      disableNext();
    }
    function disablePrevious() {
      qs(".nav-bar .js-back").setAttribute("disabled", "");
    }
    function enablePrevioust() {
      qs(".nav-bar .js-back").removeAttribute("disabled");
    }
    function disableNext() {
      qs(".nav-bar .js-next").setAttribute("disabled", "");
    }
    function enableNext() {
      qs(".nav-bar .js-next").removeAttribute("disabled");
    }
  }
  navigateToPage(p) {
    $log("navigateToPage", p);
    $log("navigateToPage", "#q" + p);

    location.hash = "#q" + p;
  }
  getPageNumber(offset = 0) {
    let currentHash = location.hash || "#q1";
    return +currentHash.replace("#q", "") + offset;
  }
  decryptAnswers(ciphertext) {
    // Decrypt
    var bytes = CryptoJS.AES.decrypt(ciphertext, "secret key 123");
    console.log(bytes);
    var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    console.log(decryptedData); // [{id: 1}, {id: 2}]
  }
  encryptAnswers(data = [{ id: 1 }, { id: 2 }]) {
    // Encrypt
    var ciphertext = CryptoJS.AES.encrypt(
      JSON.stringify(data),
      "secret key 123"
    ).toString();
    console.log(ciphertext);
  }

  /////////////////////////////////////
  /////////////////////////////////////
  startUpQuiz() {
    $log("startUpQuiz", json);

    //this.quiz = new QuizMC(json);
    //this.quiz.startUp();
    //this.initialzeNavigation();
    //return Promise.resolve(json);
  }
  loadJson() {
    function getJsonFileName(loc) {
      let [fileName, foldername, ...rest] = loc.href.split("/").reverse();
      let jsonFile =
        loc.origin + "/" + foldername + "/" + fileName.split(".")[0] + ".json";

      let pathItems = loc.href.split("/");
      fileName = pathItems.pop();
      let path = pathItems.join("/");

      let retPath = path + "/index.json";

      $log("jsonFile", retPath);
      return retPath;
    }
    function validateResponse(response) {
      $log("validateResponse", response);
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response;
    }
    function readResponseAsJSON(response) {
      $log("readResponseAsJSON", response);
      return response.json();
    }
    function logResult(result) {
      $log("logResult", result);
      return result;
    }
    function logError(error) {
      $log("Looks like there was a problem", error);
    }
    fetch(getJsonFileName(window.location))
      .then(validateResponse)
      .then(readResponseAsJSON)
      .then(logResult)
      .then(res => this.startUpQuiz(res))
      .catch(err => {
        logError(err);
        this.startUpDemoQuiz();
      });
  }

  startUpDemoQuiz() {
    console.log("### APP: startUpDemoQuiz: ");
    let demo = {
      title: "Title quiz_clickText",
      id: "q456",
      type: "quiz_clickText_mc",
      multipleAnswers: false,
      maxScore: 2,
      questionArray: [
        {
          description: "this is q1 text",
          id: 0,
          qNum: 1,
          ans: [2, 4],
          userAnswer: [2]
        }
      ]
    };
    console.log("APP: startUpDemoQuiz: ", demo);
    this.quiz = new QuizMC(demo);
    this.quiz.startUp();
  }
}
