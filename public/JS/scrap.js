const puppeteer = require("puppeteer");
// import puppeteer, { Page, PageEmittedEvents } from "puppeteer";

const { hrtime } = require("node:process");

const htmlOnly = async (page) => {
  await page.setRequestInterception(true); // enable request interception

  page.on("request", (request) => {
    const resourceType = request.resourceType();

    // Block images, styles, fonts, media, etc.
    if (resourceType === 'image' || resourceType === 'stylesheet'  || resourceType === 'font' || resourceType === 'media') { //|| resourceType === 'script'
        // console.log('abort')
        request.abort();
    } else {
        request.continue();
    }
  });
};

const scrap = async (url, selectors) => {
  if (!url) {
    return {
      status: 400,
      message: `Missing URL`,
    };
  }

  try {
    const browser = await puppeteer.launch({ headless: true });

    const page = await browser.newPage();

    const start = hrtime();

    await page.goto(url, { waitUntil: "networkidle2" }) 
    
    const end = hrtime(start);
    console.log(`Scraping took ${end[0]} seconds`);

    if (selectors.length === 0) {
      return {
        status: 200,
        message: await page.content(),
      };
    } else {

      var text = Array(selectors.length);

      for (let i = 0; i < selectors.length; i++) {
        const element = await page.waitForSelector(selectors[i]);
        if (element)
          text[i] = await page.evaluate(
            (element) =>  element.textContent,
            element
          );
      }

      await browser.close();

      return {
        status: 200,
        message: text,
      };
    }
  } catch (error) {
    return {
      status: 500,
      message: "Scraping failed " + error,
    };
  }
};

module.exports = scrap;
