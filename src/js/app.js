//import "babel-polyfill";
import { $on, qs, $log, $logt } from "./util";
import DocReady from "./windowLoaded";
import Timeline from "./timeline";
import { SCORM } from "pipwerks-scorm-api-wrapper";
import '../scss/styles.scss'
import Cheerio from 'cheerio';
//import { Base64 } from 'js-base64';

/* DocReady(() => {
  console.log('APP: DocReady: ', DocReady);
  const app = new App();
  const loadHandler = () => App.init(app, 'slides.html', '.js-wrapper');
  $on(window, "load", loadHandler.bind(app));
}); */

export default class App {
  constructor() {
    this.textElementTimeline;
    this.shapeElementTimeline;
    this.animationJson;
    this.throttled = false;
    this.showAnimations = true;
    this.allSlides;
    //this.allQuestions;
    this.currentNodeSelection;
    this.display;
    //this.quizFirstPage;
    //this.quizCurrentPage;
    this.slidesCurrentPage = 0;
    this.slideCount = 0;
    //this.quizCount = 0;
    this.displayModeBtns = document.getElementsByName("displayMode");

    this.displayTypes = [
      {
        type: 'slides',
        prefix: 's',
        page: 'slides.html',
        selector: 'page-',
        button: '#slidesRadio'
      },
      {
        type: 'quiz',
        prefix: 'q',
        page: 'quiz.html',
        selector: 'question-',
        button: '#quizRadio'
      },
      {
        type: 'media',
        prefix: 'm',
        page: 'media.html',
        selector: 'media-',
        button: '#mediaRadio'
      }
    ]
  }

  static init(inst, url, selector) {
    inst.loadSection(url, selector);
  }

  loadSection(url, selector) {
    //alert('LOAD')
    console.log('APP: loadSection: ');
    const content_div = qs(selector);
    const xmlHttp = new XMLHttpRequest();
    let cFunction = this.setView.bind(this);

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

  pageLoaded(xhttp) {
    alert('pageLoaded')
  }

  setView() {

    this.definePages();
    this.hidePages();
    this.continueStartUp();
    return;


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

  definePages() {
    $log('****** this.querySelectorAll ', document.querySelectorAll(".container--layout-1"));
    [...this.allSlides] = document.querySelectorAll(".container--layout-1, .container--iquiz");
    //[...this.allQuestions] = document.querySelectorAll(".container--iquiz");
    this.slideCount = this.allSlides.length;
    //this.quizCount = this.allQuestions.length;

    $log('****** this.slideCount ', this.slideCount);
    //$log('****** this.quizCount ', this.quizCount);


    //this.quizFirstPage = this.slideCount;
    //this.quizCurrentPage = this.slideCount;
  }
  hidePages() {
    // Set wrapper and pages to hidden
    qs(".js-wrapper").classList.add = "hidden";
    this.allSlides.forEach(el => {
      el.classList.add("hidden");
    });


    //this.allQuestions.forEach(el => {
    //  el.classList.add("hidden");
    //});
  }
  continueStartUp(json = {}) {
    //console.log('****** continueStartUp ');
    this.animationJson = json;
    this.setStateValues();
    this.setNavigationEvents();
    this.displayPage();
    this.doResize();
    this.resetNavigationStates();
    this.createAnimationTimelines();
    if (this.showAnimations) this.playTimelines();
  }

  setStateValues() {

    location.hash = location.hash || "#s0";

    const query = /\#(.)(\d+)/.exec(location.hash);
    const prefix = query[1];
    this.currentPage = +query[2];
    const thisSectionType = this.displayTypes.find(type => type.prefix === prefix);
    this.display = thisSectionType.type;
    qs(thisSectionType.button).checked = true;

    $log('****** this.currentPage ', this.currentPage);
    $log('****** prefix ', prefix);
    $log('****** this.display ', this.display);
    $log('****** thisSectionType.button ', thisSectionType.button);

    /* if (media) {
      this.currentPage = +media[1];
      this.display = "media";
      //this.currentNodeSelection = this.allQuestions;
      qs("#mediaRadio").checked = true;
    }
    const quiz = /\#q(\d+)/.exec(location.hash);
    if (quiz) {
      this.currentPage = +quiz[1];
      this.display = "quiz";
      //this.currentNodeSelection = this.allQuestions;
      qs("#quizRadio").checked = true;
    }
    const slide = /\#s(\d+)/.exec(location.hash);
    if (slide) {
      this.currentPage = +slide[1];
      this.display = "slides";
      //this.currentNodeSelection = this.allSlides;
      qs("#slidesRadio").checked = true;
    } */
  }

  setNavigationEvents() {
    location.hash = location.hash || "#s0";
    qs(".js-back").onclick = e => this.previousClick();
    qs(".js-next").onclick = e => this.nextClick();
    qs(".js-replay").onclick = e => this.replayAnimation();
    qs(".js-animation input").checked = this.showAnimations;
    qs(".js-animation input").onclick = e => this.toggleAnimation(e);
    Array.from(document.querySelectorAll(".js-start-quiz")).forEach(el => {
      el.onclick = e => this.startQuiz(e);
    });

    Array.from(this.displayModeBtns)
      .forEach(v => v.addEventListener("change", e => {
        this.displayModeChanged(e.currentTarget.value);
      }));
    $on(window, "hashchange", this.hashChangedHandler.bind(this));
    //qs("body").addEventListener("touchmove", this.freezeVp, false);
    qs(".l-nav-bar").addEventListener("touchmove", this.preventDefault, false);
    qs(".l-header").addEventListener("touchmove", this.preventDefault, false);

    $on(window, "resize", this.debounce(e => {
      this.doResize();
    }, 1000));

  }

  debounce(fn, time) {
    $log('>>>>>>>>>> DEBOUNCE')
    let timeout;
    return function () {
      const functionCall = () => fn.apply(this, arguments);
      clearTimeout(timeout);
      timeout = setTimeout(functionCall, time);
    };
  };

  displayPage() {
    const currentPageNum = this.getPageNumber(),
      currentPageNode = this.getPageNode(currentPageNum),
      isLeft = currentPageNode.classList.contains("left"),
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

  hashChangedHandler() {
    this.setStateValues();
    this.hidePages();
    this.displayPage();
    this.doResize();
    this.resetNavigationStates();
    this.setPageNumber(this.getPageNumber());
    document.querySelector("body").scrollTop = 0;
    if (this.showAnimations) this.createAnimationTimelines();
    if (this.showAnimations) this.playTimelines();
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

  addPageNumber(el, num) {
    el.insertAdjacentHTML("beforeend", `<div class="page-number">${num}</div>`);
  }

  startQuiz(e) {
    console.log("****** startQuiz ", e.target);
    if (!this.quizFirstPage) {
      return;
    }
    this.display = "quiz";
    this.currentNodeSelection = this.allQuestions;
    const PageNum = this.quizFirstPage;
    Array.from(this.displayModeBtns).forEach(el => {
      if (el.value === "quiz") {
        el.checked = true;
      }
    });
    this.hidePages();
    this.navigateToPage(PageNum);
    this.displayPage();
    this.doResize();
    this.resetNavigationStates();
    if (this.showAnimations) this.createAnimationTimelines();
    if (this.showAnimations) this.playTimelines();
  }

  displayModeChanged(e) {
    //Array.from(this.displayModeBtns).forEach(v => v.checked ? console.log(v.getAttribute('value')) : null)
    let checkedEl = Array.from(this.displayModeBtns).find(el => {
      if (el.checked) return true;
    });
    if (this.display !== checkedEl.value) {
      this.display = checkedEl.value;

      //this.currentNodeSelection = this.allSlides;
      /*  **************************
         this.currentNodeSelection =
         this.display === "slides" ? this.allSlides : this.allQuestions;
       const PageNum =
         this.display === "slides"
           ? this.slidesCurrentPage
           : this.quizCurrentPage; 
       ***************************/


      this.loadSection('slides.html', '.js-wrapper', app.setView.bind(app))

      this.hidePages();
      this.navigateToPage(this.slidesCurrentPage);
      this.displayPage();
      this.doResize();
      this.resetNavigationStates();
      if (this.showAnimations) this.createAnimationTimelines();
      if (this.showAnimations) this.playTimelines();
    }
  }

  navigateToPage(p) {
    //window.removeEventListener('hashchange', this.hashChangedHandler.bind(this));
    location.hash = this.display === "slides" ? "#s" + p : "#q" + p;
    //$on(window, 'hashchange', this.hashChangedHandler.bind(this));
    //if (this.display === 'slides') this.slidesCurrentPage = p;
    //if (this.display === 'quiz') this.quizCurrentPage = p;
    this.setPageNumber(p);
    //this.resetNavigationStates();
    document.querySelector('body').scrollTop = 0;
  }

  setPageNumber(page) {
    this.slidesCurrentPage = page;
    //if (this.display === "slides") this.slidesCurrentPage = page;
    //if (this.display === "quiz") this.quizCurrentPage = page;
  }

  getPageNumber(offset = 0) {
    const pageTypes = {
      slides: 's',
      quiz: 'q',
      media: 'm'
    }
    const pageTypeCodes = {
      s: 'slides',
      q: 'quiz',
      m: 'media'
    }

    const pagePrefix = pageTypes[this.display];
    let currentHash = location.hash || "#s0";

    return +currentHash.replace("#" + pagePrefix, "") + offset;

    //const pagePrefix = this.display === "slides" ? "s" : "q";
    //let currentHash = location.hash || "#s0";

    /* if (this.display === "slides") {
      return +currentHash.replace("#s", "") + offset;
    } else if (this.display === "quiz") {
      return +currentHash.replace("#q", "") + offset;
    } */
  }

  getPageNode(page) {
    const pageNamePrefixes = {
      slides: 'page-',
      quiz: 'question-',
      media: 'media-'
    }
    const pageNamePrefix = pageNamePrefixes[this.display];

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

    if (this.display === "slides") {
      bar.style.width =
        ((this.getPageNumber() + pageNumOffset) / this.slideCount) * 100 + "%";
      desc.textContent = `${this.getPageNumber() + pageNumOffset} / ${
        this.slideCount
        }`;
    } else if (this.display === "quiz") {
      let width = (bar.style.width =
        ((this.getPageNumber() - this.slideCount + pageNumOffset) /
          this.quizCount) *
        100 +
        "%");
      desc.textContent = `${this.getPageNumber() -
        this.slideCount +
        pageNumOffset} / ${this.quizCount}`;
    }
  }

  resetNavigationStates() {
    //$log("resetNavigationStates 22");
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

  toggleAnimation(e) {
    //console.log('****** toggleAnimation ', e.target.checked);
    this.showAnimations = e.target.checked;
  }
  replayAnimation() {
    if (this.textElementTimeline) this.textElementTimeline.replayAnimation();
    if (this.shapeElementTimeline) this.shapeElementTimeline.replayAnimation();
  }
  nextClick() {
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
}
