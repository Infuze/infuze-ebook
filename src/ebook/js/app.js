import "babel-polyfill";
import { $on, qs, $log, $logt } from "./util";
import DocReady from "./windowLoaded";
import Timeline from "./timeline";
import { SCORM } from "pipwerks-scorm-api-wrapper";
//import '../scss/styles.scss'
import Cheerio from 'cheerio';
import Router from './router';
import Quiz from '../../iquiz/js/q-app'
//import { Base64 } from 'js-base64';
export default class Ebook {
  constructor() {
    this.textElementTimeline;
    this.shapeElementTimeline;
    this.animationJson = {};
    this.throttled = false;
    this.showAnimations = true;
    this.allSlides = [];
    this.currentNodeSelection;
    this.display;
    this.router;
    this.quiz;
    this.slidesCurrentPage = 0;
    this.slideCount = 0;
    this.displayModeBtns = document.getElementsByName("displayMode");

    this.displayTypes = [
      {
        type: 'slides',
        container: '.container--layout-1',
        prefix: 's',
        page: 'slides.html',
        selector: 'page-',
        button: '#slidesRadio'
      },
      {
        type: 'quiz',
        container: '.container--iquiz',
        prefix: 'q',
        page: 'quiz.html',
        selector: 'question-',
        button: '#quizRadio'
      },
      {
        type: 'media',
        container: '.container--media',
        prefix: 'm',
        page: 'media.html',
        selector: 'media-',
        button: '#mediaRadio'
      }
    ]
  }

  init() {
    $log('init')
    this.router = new Router({ errorPage: 'task1/slides/0' })
      .add(/task1\/slides\/0/, () => {
        this.loadSection();
      })
      .add(/task1\/quiz\/0/, () => {
        this.loadSection();
      })
      .add(/task1\/media\/0/, () => {
        this.loadSection();
      })

    this.setNavigationEvents();
    $on(window, "onbeforeunload", SCORM.quit);
    $on(window, "onunload", SCORM.quit);
    this.router.navigate('task1/slides/0');
  }

  loadSection() {
    $log('loadSection')
    $log('this.router', this.router)
    const urlPaths = Router.parseRoute(this.router.currentRoute);

    let flagForReload = false;
    if (this.task !== urlPaths[0]) {
      this.task = urlPaths[0];
      flagForReload = true;
    }
    if (this.taskType !== urlPaths[1]) {
      this.taskType = urlPaths[1];
      flagForReload = true;
    }
    this.currentPage = urlPaths[2];

    const thisSectionType = this.displayTypes.find(type => type.type === this.taskType);
    this.display = thisSectionType.type;

    if (flagForReload) {
      this.loadHTML();
    } else {
      this.setView();
    }
  }

  loadHTML() {
    $log('****** loadHTML ');
    const url = this.task + '-' + this.taskType + '.html',
      selector = '.js-wrapper';

    const content_div = qs(selector);
    const xmlHttp = new XMLHttpRequest();
    let cFunction = this.htmlLoaded.bind(this);

    xmlHttp.onreadystatechange = function () {
      if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
        const $ = Cheerio.load(xmlHttp.responseText);
        const content = $(selector).children()
          .after($(this).contents())
          .remove();
        content_div.innerHTML = content;
        cFunction(this);
      }
    };
    xmlHttp.open("GET", url, true);
    xmlHttp.send(null);
  }

  htmlLoaded() {
    $log('****** htmlLoaded ');
    if (this.taskType === 'quiz') {
      this.quiz = new Quiz();
      this.quiz.on('initialzeNavigation', this.quizInit.bind(this));
      this.quiz.on('beginQuiz', this.beginQuiz.bind(this));
      this.quiz.on('navigateToPage', this.navigateToPage.bind(this));
      this.quiz.on('navigateToNextPage', this.navigateToNextPage.bind(this));
      this.quiz.startUp();
    }
    this.setPageEvents();
    this.definePages();
    this.addRoutes();
    this.setView();
  }

  addRoutes() {
    $log('****** addRoutes ');
    const urlPaths = Router.parseRoute(this.router.currentRoute);
    this.task = urlPaths[0];
    this.taskType = urlPaths[1];

    for (let i = 0; i < this.slideCount; i++) {
      let route = this.task + '/' + this.taskType + '/' + i;
      $log('route ', route)
      this.router
        .remove(route)
        .add(route, () => {
          this.loadSection();
        })
    }
  }

  beginQuiz(evt) {
    $log('****** beginQuiz ', evt);
  }
  quizInit(evt) {
    $log('****** initialzeNavigation ', evt);
  }

  setView() {
    this.setStateValues();
    this.hidePages();
    this.displayPage();
    this.doResize();
    this.resetNavigationStates();

    SCORM.init();
    ///ANIME/// this.createAnimationTimelines();
    ////ANIME/// if (this.showAnimations) this.playTimelines();
  }
  setPageEvents() {
    Array.from(document.querySelectorAll(".js-start-quiz")).forEach(el => {
      el.onclick = e => this.startQuiz(e);
    });
  }
  setStateValues() {
    const urlPaths = Router.parseRoute(this.router.currentRoute);
    this.task = urlPaths[0];
    if (this.taskType !== urlPaths[1]) {
      this.taskType = urlPaths[1];
    }

    this.currentPage = urlPaths[2];

    const thisSectionType = this.displayTypes.find(type => type.type === this.taskType);
    this.display = thisSectionType.type;
    qs(thisSectionType.button).checked = true;
  }
  hidePages() {
    // Set wrapper and pages to hidden
    qs(".js-wrapper").classList.add = "hidden";
    this.allSlides.forEach(el => {
      el.classList.add("hidden");
    });
  }
  definePages() {
    $log('****** definePages ', this.display);
    const container = this.displayTypes.find(type => type.type === this.display).container;
    [...this.allSlides] = document.querySelectorAll(container);
    this.slideCount = this.allSlides.length;
  }
  displayPage() {
    const currentPageNum = this.getPageNumber();
    const currentPageNode = this.getPageNode(currentPageNum);

    if (!currentPageNode) {
      alert('displayPage - No page nodes!');
      return;
    }

    const isLeft = currentPageNode.classList.contains("left"),
      isRight = currentPageNode.classList.contains("right");

    this.addPageNumber(currentPageNode, currentPageNum);

    currentPageNode.classList.remove("hidden");
    // Show current page and left or right page
    if (isLeft) {
      this.getPageNode(currentPageNum + 1).classList.remove("hidden");
      this.addPageNumber(this.getPageNode(currentPageNum + 1));
    }
    if (isRight) {
      this.getPageNode(currentPageNum - 1).classList.remove("hidden");
      this.addPageNumber(this.getPageNode(currentPageNum - 1));
    }
    // show wrapper
    qs(".js-wrapper").classList.remove("hidden");
  }
  doResize() {
    $log('****** doResize');
    const thisPageNode = this.getPageNode(this.getPageNumber()),
      nextPageNode = this.getPageNode(this.getPageNumber(1)),
      prevPageNode = this.getPageNode(this.getPageNumber(-1)),
      isLeft = thisPageNode.classList.contains("left"),
      isRight = thisPageNode.classList.contains("right");
    let pageToHide;

    if (isLeft) pageToHide = nextPageNode;
    if (isRight) pageToHide = prevPageNode;

    if (window.innerWidth < 900) {
      //TODO SAME AS tablet-landscape-up
      if (pageToHide) pageToHide.classList.add("hidden");
    } else {
      if (pageToHide) pageToHide.classList.remove("hidden");
    }
    //this.resetNavigationStates();
  }




  setNavigationEvents() {
    location.hash = location.hash || "#s0";
    qs(".js-back").onclick = e => this.previousClick();
    qs(".js-next").onclick = e => this.nextClick();
    ///ANIME/// qs(".js-animation input").checked = this.showAnimations;
    ///ANIME/// qs(".js-animation input").onclick = e => this.toggleAnimation(e);

    Array.from(this.displayModeBtns)
      .forEach(v => v.addEventListener("change", e => {
        this.displayModeChanged(e.currentTarget.value);
      }));
    //$on(window, "hashchange", this.hashChangedHandler.bind(this));
    //qs("body").addEventListener("touchmove", this.freezeVp, false);
    qs(".l-nav-bar").addEventListener("touchmove", this.preventDefault, false);
    qs(".l-header").addEventListener("touchmove", this.preventDefault, false);

    $on(window, "resize", this.debounce(e => {
      this.doResize();
    }, 200));
  }

  debounce(fn, time) {
    //$log('>>>>>>>>>> DEBOUNCE')
    let timeout;
    return function () {
      const functionCall = () => fn.apply(this, arguments);
      clearTimeout(timeout);
      timeout = setTimeout(functionCall, time);
    };
  };



  isNextPageVisible() {
    const currentPageNum = this.getPageNumber();
    let nextPageNode = this.getPageNode(currentPageNum + 1);
    if (
      nextPageNode &&
      nextPageNode.classList.contains("right") &&
      !nextPageNode.classList.contains("hidden")
    ) {
      return true;
    } else {
      return false;
    }
  }



  addPageNumber(el, num) {
    el.insertAdjacentHTML("beforeend", `<div class="page-number">${num}</div>`);
  }



  nextClick() {
    const thisPageNode = this.getPageNode(this.getPageNumber());
    $log('thisPageNode', thisPageNode)
    if (
      this.getPageNode(this.getPageNumber()).classList.contains("left") &&
      this.getPageNode(this.getPageNumber(1)) &&
      !this.getPageNode(this.getPageNumber(1)).classList.contains("hidden")
    ) {
      this.navigateToPage(this.getPageNumber(2));
    } else {
      this.navigateToPage(this.getPageNumber(1));
    }
  }
  previousClick() {
    if (
      this.getPageNode(this.getPageNumber()).classList.contains("right") &&
      this.getPageNode(this.getPageNumber(-1)) &&
      !this.getPageNode(this.getPageNumber(-1)).classList.contains("hidden")
    ) {
      this.navigateToPage(this.getPageNumber(-2));
    } else {
      this.navigateToPage(this.getPageNumber(-1));
    }
  }
  displayModeChanged(e) {
    //Array.from(this.displayModeBtns).forEach(v => v.checked ? console.log(v.getAttribute('value')) : null)
    let checkedEl = Array.from(this.displayModeBtns).find(el => {
      if (el.checked) return true;
    });
    this.setPageNumber(0);
    const thisSectionType = this.displayTypes.find(type => type.type === checkedEl.value);

    const urlPaths = Router.parseRoute(this.router.currentRoute);
    this.task = urlPaths[0];

    const newURL = this.task + '/' + thisSectionType.type + '/0';
    $log('newURL ', newURL)
    this.router.navigate(newURL);
  }

  startQuiz(e) {
    //console.log("****** startQuiz ", e.target);
    const urlPaths = Router.parseRoute(this.router.currentRoute);
    this.task = urlPaths[0];

    const newURL = this.task + '/quiz/0';
    $log('newURL ', newURL)
    this.router.navigate(newURL);


    //location.hash = '#q0';
    //this.setPageNumber(0);
    //document.querySelector('body').scrollTop = 0;
  }
  navigateToNextPage(p = 0) {
    $log('navigateToNextPage ', p)

    p = this.getPageNumber(1);
    const urlPaths = Router.parseRoute(this.router.currentRoute);
    this.task = urlPaths[0];
    this.taskType = urlPaths[1];

    const newURL = this.task + '/' + this.taskType + '/' + p;
    $log('newURL ', newURL)
    this.router.navigate(newURL);
  }
  navigateToPage(p = 0) {
    $log('navigateToPage ', p)

    const urlPaths = Router.parseRoute(this.router.currentRoute);
    this.task = urlPaths[0];
    this.taskType = urlPaths[1];

    const newURL = this.task + '/' + this.taskType + '/' + p;
    $log('newURL ', newURL)
    this.router.navigate(newURL);


    //const thisSectionType = this.displayTypes.find(type => type.type === this.display);
    //location.hash = '#' + thisSectionType.prefix + p;
    this.setPageNumber(p);
    document.querySelector('body').scrollTop = 0;
  }

  setPageNumber(page) {
    this.slidesCurrentPage = page;
  }

  getPageNumber(offset = 0) {

    const urlPaths = Router.parseRoute(this.router.currentRoute);
    return +urlPaths[2] + offset;


    /* const pagePrefix = this.displayTypes.find(type => type.type === this.display).prefix;
    let currentHash = location.hash || "#s0";
    return +currentHash.replace("#" + pagePrefix, "") + offset; */
  }

  getPageNode(page) {
    console.log('getPageNode ', page);
    console.log('this.display ', this.display);
    const pageNamePrefix = this.displayTypes.find(type => type.type === this.display).selector;
    let node = this.allSlides.find(
      n => n.id === pageNamePrefix + page
    ) || null;
    return node;
  }

  updateProgressBar() {
    //$log("updateProgressBar quiz ", this.display);
    const bar = qs(".nav-bar__progress-bar"),
      desc = qs(".nav-bar__progress-txt"),
      pageNumOffset = this.isNextPageVisible() ? 2 : 1;

    bar.style.width = ((this.getPageNumber() + pageNumOffset) / this.slideCount) * 100 + "%";
    desc.textContent = `${this.getPageNumber() + pageNumOffset} / ${this.slideCount}`;
  }

  resetNavigationStates() {
    let thisPageNode = this.getPageNode(this.getPageNumber()),
      nextPageNode = this.getPageNode(this.getPageNumber(1)),
      prevPageNode = this.getPageNode(this.getPageNumber(-1));

    if (prevPageNode) {
      if (prevPageNode.classList.contains("left")) {
        if (prevPageNode.classList.contains("hidden")) {
          enablePrevioust();
        } else {
          prevPageNode = this.getPageNode(this.getPageNumber(-2));
          if (prevPageNode) {
            enablePrevioust();
          } else {
            disablePrevious();
          }
        }
      } else {
        enablePrevioust();
      }
    } else {
      disablePrevious();
    }

    if (nextPageNode) {
      if (nextPageNode.classList.contains("right")) {
        if (nextPageNode.classList.contains("hidden")) {
          enableNext();
        } else {
          // Already visible
          nextPageNode = this.getPageNode(this.getPageNumber(2));
          if (nextPageNode) {
            enableNext();
          } else {
            disableNext();
          }
        }
      } else {
        enableNext();
      }
    } else {
      disableNext();
    }

    this.updateProgressBar();

    function disablePrevious() {
      qs(".js-back").setAttribute("disabled", "");
    }
    function enablePrevioust() {
      qs(".js-back").removeAttribute("disabled");
    }
    function disableNext() {
      qs(".js-next").setAttribute("disabled", "");
    }
    function enableNext() {
      qs(".js-next").removeAttribute("disabled");
    }
  }



  hashChangedHandler() { // UNUSED

    const query = /\#(.)(\d+)/.exec(location.hash);
    const prefix = query[1];
    this.currentPage = +query[2];

    $log('****** hashChangedHandler ', prefix + ":" + query);

    if (this.displayTypes.find(type => type.prefix === prefix).type !== this.display) {
      this.loadSection();
      return;
    }

    //this.setStateValues();
    this.hidePages();
    this.displayPage();
    this.doResize();
    this.resetNavigationStates();
    this.setPageNumber(this.getPageNumber());
    document.querySelector("body").scrollTop = 0;


    const urlPaths = Router.parseRoute(this.router.currentRoute);
    this.task = urlPaths[0];
    if (this.taskType !== urlPaths[1]) {
      this.taskType = urlPaths[1];
    }

    this.currentPage = urlPaths[2];

    const thisSectionType = this.displayTypes.find(type => type.type === this.taskType);
    this.display = thisSectionType.type;
    qs(thisSectionType.button).checked = true;



    ///ANIME/// if (this.showAnimations) this.createAnimationTimelines();
    ///ANIME/// if (this.showAnimations) this.playTimelines();
  }



  //////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////// TIMELINE ANIMATION ///////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////////////

  toggleAnimation(e) {
    //console.log('****** toggleAnimation ', e.target.checked);
    this.showAnimations = e.target.checked;
  }
  replayAnimation() {
    if (this.textElementTimeline) this.textElementTimeline.replayAnimation();
    if (this.shapeElementTimeline) this.shapeElementTimeline.replayAnimation();
  }
  playTimelines() {
    if (this.textElementTimeline) this.textElementTimeline.startAmnimation();
    if (this.shapeElementTimeline) this.shapeElementTimeline.startAmnimation();
  }

  disableNav() {
    qs(".js-next").setAttribute("disabled", "");
    qs(".js-back").setAttribute("disabled", "");
  }
  enableNav() {
    this.resetNavigationStates();
  }
  onTimelineStarted(evt) {
    //$log(">>>>>>>>>>>>>> onTimelineStarted ", evt);
    this.disableNav();
  }
  onTimelineFinished(evt) {
    //$log(">>>>>>>>>>>>>> onTimelineFinished ", evt);
    let textComplete = true,
      shapesComplete = true;

    if (this.textElementTimeline && this.textElementTimeline.status !== 'complete') {
      textComplete = false
    }
    if (this.shapeElementTimeline && this.shapeElementTimeline.status !== 'complete') {
      shapesComplete = false
    }
    if (textComplete && shapesComplete) this.enableNav();
    document.querySelector("body").scrollTop = 0;
    window.scrollTo(0, 1);
  }
  createAnimationTimelines() {
    //$log(">>>>>>>>>>>>>> createAnimationTimelines");
    const defaultDuration = "200",
      defaultOffset = "-=50",
      currentPageNum = this.getPageNumber(),
      currentPageNode = this.getPageNode(this.getPageNumber()),
      prevPageNode = this.getPageNode(this.getPageNumber(-1)),
      nextPageNode = this.getPageNode(this.getPageNumber(1)),
      isLeft = currentPageNode.classList.contains("left"),
      isRight = currentPageNode.classList.contains("right");

    const pageNamePrefix = this.display === "slides" ? "#page-" : "#question-";

    const [...currentPageNodelist] = document.querySelectorAll(pageNamePrefix + currentPageNum + " [data-animate]"),
      [...lefttNodelist] = document.querySelectorAll(
        pageNamePrefix + (currentPageNum - 1) + " [data-animate]"
      ),
      [...rightNodelist] = document.querySelectorAll(
        pageNamePrefix + (currentPageNum + 1) + " [data-animate]"
      );
    let completeTextNodeList, completeShapeNodeList;

    //$log("****************** isLeft ", isLeft);
    //$log("****************** isRight ", isRight);

    if (
      isLeft &&
      nextPageNode &&
      nextPageNode.classList.contains("right") &&
      !nextPageNode.classList.contains("hidden")
    ) {
      // Combine next page nodes
      //$log("****************** Combine next page nodes ");
      const currentPageTextNodelistSorted = getTextNodes(
        currentPageNodelist,
        currentPageNum
      ),
        currentPageShapeNodelistSorted = getShapeNodes(
          currentPageNodelist,
          currentPageNum
        ),
        nextPageTextNodelistSorted = getTextNodes(
          rightNodelist,
          currentPageNum + 1
        ),
        nextPageShapeNodelistSorted = getShapeNodes(
          rightNodelist,
          currentPageNum + 1
        );

      completeTextNodeList = [
        ...nextPageTextNodelistSorted,
        ...currentPageTextNodelistSorted
      ];
      completeShapeNodeList = [
        ...nextPageShapeNodelistSorted,
        ...currentPageShapeNodelistSorted
      ];
    } else if (
      isRight &&
      prevPageNode &&
      prevPageNode.classList.contains("left") &&
      !prevPageNode.classList.contains("hidden")
    ) {
      // Combine previous page nodes
      //$log("****************** Combine previous page nodes ");
      const currentPageTextNodelistSorted = getTextNodes(
        currentPageNodelist,
        currentPageNum
      ),
        currentPageShapeNodelistSorted = getShapeNodes(
          currentPageNodelist,
          currentPageNum
        ),
        previousPageTextNodelistSorted = getTextNodes(
          lefttNodelist,
          currentPageNum - 1
        ),
        previousPageShapeNodelistSorted = getShapeNodes(
          lefttNodelist,
          currentPageNum - 1
        );

      completeTextNodeList = [
        ...currentPageTextNodelistSorted,
        ...previousPageTextNodelistSorted
      ];
      completeShapeNodeList = [
        ...currentPageShapeNodelistSorted,
        ...previousPageShapeNodelistSorted
      ];
    } else {
      // This page nodes only
      //$log("****************** This page nodes only ");
      completeTextNodeList = getTextNodes(currentPageNodelist, currentPageNum);
      completeShapeNodeList = getShapeNodes(
        currentPageNodelist,
        currentPageNum
      );
    }

    function getTextNodes(nodes, page, counter = 0) {
      return nodes
        .filter(node => /P|H1|H2|H3|H4|H5|LI|UL|OL|DIV|BUTTON/.test(node.nodeName))
        .map(node => {
          let step = node.getAttribute("data-animate");
          if (!step || step === "*" || step === "") {
            counter++;
            node.setAttribute("data-animate", counter);
          } else {
            counter = +step;
          }
          return node;
        })
        .sort(sorter)
        .reverse()
        .map(node => {
          node.pageNumber = page;
          return node;
        });
    }
    function getShapeNodes(nodes, page) {
      return nodes
        .filter(node => /FIGURE|IMG/.test(node.nodeName))
        .sort(sorter)
        .reverse()
        .map(node => {
          node.pageNumber = page;
          return node;
        });
    }
    function sorter(obj1, obj2) {
      return obj1.dataset.animate - obj2.dataset.animate;
    }

    if (completeTextNodeList.length) {
      //$logt(completeTextNodeList, 'completeTextNodeList');
      this.textElementTimeline = new Timeline(
        completeTextNodeList,
        this.animationJson
      );
      this.textElementTimeline.on('started', this.onTimelineStarted.bind(this));
      this.textElementTimeline.on('complete', this.onTimelineFinished.bind(this));
      this.textElementTimeline.setup();
    }
    if (completeShapeNodeList.length) {
      //$logt(completeShapeNodeList, 'completeShapeNodeList');
      this.shapeElementTimeline = new Timeline(
        completeShapeNodeList,
        this.animationJson
      );
      this.shapeElementTimeline.on('started', this.onTimelineStarted.bind(this));
      this.shapeElementTimeline.on('complete', this.onTimelineFinished.bind(this));
      this.shapeElementTimeline.setup();
    }

    return;
  }

  loadJSON() { // UNUSED
    function getJsonFileName(loc) {
      let [fileName, foldername, ...rest] = loc.href.split("/").reverse();
      let pathItems = loc.href.split("/");
      fileName = pathItems.pop();
      let path = pathItems.join("/");
      let retPath = path + "/animate.json";
      return retPath;
    }
    function validateResponse(response) {
      //console.log('APP: validateResponse: ', response);
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response;
    }
    function readResponseAsJSON(response) {
      //console.log('APP: readResponseAsJSON: ', response);
      return response.json();
    }
    function logResult(result) {
      //console.log('APP: logResult: ', result);
      return result;
    }
    function logError(error) {
      //console.log('Looks like there was a problem: \n', error);
    }
    function setAminProps(response) {
      //console.log('****** setAminProps response', response);
      this.animations = response;
    }
    //console.log('****** loadAnimationSeq start');

    return (
      fetch(getJsonFileName(window.location), {
        headers: { Accept: "application/json" },
        credentials: "same-origin"
      })
        .then(validateResponse)
        .then(readResponseAsJSON)
        .then(logResult)
        //.then(setAminProps)
        .then(res => this.continueStartUp(res))
        .catch(err => {
          logError(err);
          this.continueStartUp({});
        })
    );
  }
  continueStartUp(json = {}) {

  }
}
