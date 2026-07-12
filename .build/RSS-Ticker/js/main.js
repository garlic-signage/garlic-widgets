"use strict";
(() => {
  // .build/RSS-Ticker/js/TickerApp.js
  var TickerApp = class {
    #tickerView = {};
    #rssFetcher = {};
    #tickerFormatter = {};
    constructor(tickerView, tickerFormatter, rssFetcher) {
      this.#tickerView = tickerView;
      this.#rssFetcher = rssFetcher;
      this.#tickerFormatter = tickerFormatter;
    }
    init() {
      const url = this.getUrlParam("url", "https://www.phoronix.com/rss.php");
      const color = this.getUrlParam("color", "black");
      const fontSize = this.getUrlParam("font_size", "30");
      const bgColor = this.getUrlParam("bgcolor", "transparent");
      this.#tickerView.setStyle(color, fontSize);
      document.body.style.background = bgColor;
      window.addEventListener("resize", () => this.#tickerView.resize(), false);
      this.loadFeed(url);
    }
    async loadFeed(url) {
      try {
        const feedObj = await this.#rssFetcher.fetch(url);
        const tickerText = this.#tickerFormatter.format(feedObj);
        this.#tickerView.start(tickerText);
      } catch (error) {
        console.error(error);
      }
    }
    getUrlParam(name, defaultValue) {
      const url = new URL(window.location);
      const value = url.searchParams.get(name);
      return value === "" || value == null ? defaultValue : value;
    }
  };

  // .build/RSS-Ticker/js/TickerView.js
  var TickerView = class {
    #canvas = document.getElementById("myTicker");
    #ctx = {};
    #movePixel = 1;
    #maxCanvasWidth = 16384;
    #x = 0;
    #margin = 10;
    #textWidth = 0;
    #tickerContent = "";
    #tickerColor = "yellow";
    #fontSize = 30;
    constructor() {
      this.#ctx = this.#canvas.getContext("2d");
    }
    setStyle(color, fontSize) {
      this.#tickerColor = color;
      this.#fontSize = parseInt(fontSize);
    }
    resize() {
      this.#canvas.width = window.innerWidth;
      this.#margin = Math.round(this.#fontSize / 3);
      this.#canvas.height = this.#fontSize + this.#margin;
      this.#ctx.font = `bold ${this.#fontSize}px Sans`;
      this.#ctx.fillStyle = this.#tickerColor;
      this.#textWidth = Math.round(this.#ctx.measureText(this.#tickerContent).width) + 1;
      this.#x = this.#canvas.width;
    }
    isNewContentSizeValid(text) {
      return this.#ctx.measureText(text).width < this.#maxCanvasWidth;
    }
    setContent(text) {
      this.#tickerContent = text;
    }
    animate() {
      this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
      if (this.#x > -this.#textWidth)
        this.#x -= this.#movePixel;
      else
        this.#x = this.#canvas.width;
      this.#ctx.fillText(this.#tickerContent, this.#x, this.#canvas.height - this.#margin);
      window.requestAnimationFrame(() => this.animate());
    }
    start(text) {
      this.setContent(text);
      this.resize();
      window.requestAnimationFrame(() => this.animate());
    }
  };

  // .build/RSS-Ticker/js/TickerFormater.js
  var TickerFormatter = class {
    #tickerView = {};
    #separator = " +++ ";
    constructor(tickerView) {
      this.#tickerView = tickerView;
    }
    format(feedObj) {
      let tickerText = this.#separator;
      for (let i = 0; i < feedObj.query.count; i++) {
        const itemText = feedObj.query.results.item[i].title + this.#separator;
        if (this.#tickerView.isNewContentSizeValid(tickerText + itemText)) {
          tickerText += itemText;
        } else {
          break;
        }
      }
      return tickerText;
    }
  };

  // .build/RSS-Ticker/js/RSSFetcher.js
  var RSSFetcher = class {
    constructor(baseUrl) {
      this.baseUrl = baseUrl + "?feed_url=";
    }
    fetch(feedUrl) {
      return new Promise((resolve, reject) => {
        const requestUrl = this.baseUrl + feedUrl;
        const request = new XMLHttpRequest();
        request.open("GET", requestUrl, true);
        request.onload = () => {
          if (request.readyState === 4 && request.status === 200)
            resolve(JSON.parse(request.responseText));
          else
            reject(new Error(request.statusText));
        };
        request.onerror = () => reject(new Error(request.statusText));
        request.send(null);
      });
    }
  };

  // .build/RSS-Ticker/js/main.js
  document.addEventListener("DOMContentLoaded", () => {
    const pathToFetcherScript = "https://YOUR_PATH_TO/fetch-rss.php";
    const tickerView = new TickerView();
    const tickerFormatter = new TickerFormatter(tickerView);
    const rssFetcher = new RSSFetcher(pathToFetcherScript);
    const app = new TickerApp(tickerView, tickerFormatter, rssFetcher);
    app.init();
  });
})();
