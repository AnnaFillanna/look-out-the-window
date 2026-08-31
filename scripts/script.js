/* CONFIG */
const preloaderWaitindTime = 1200;
const cardsOnPage = 5;
const BASE_URL = 'https://v-content.practicum-team.ru';
const endpoint = `${BASE_URL}/api/videos?pagination[pageSize]=${cardsOnPage}&`;

/* CITY TRANSLATIONS */
const cityTranslations = {
  'Белгород': 'Belgorod',
  'Адлер': 'Adler',
  'Воронеж': 'Voronezh',
  'Санкт-Петербург': 'Saint Petersburg',
  'Москва': 'Moscow',
  'Казань': 'Kazan',
  'Сочи': 'Sochi',
};

/* DESCRIPTION TRANSLATIONS */
const descriptionTranslations = {
  'ночной Белгород': 'Belgorod at night',
  'Белгород ночью': 'Belgorod at night',
  'Адлер утром': 'Adler in the morning',
  'Адлер днем': 'Adler in the afternoon',
  'Адлер днём': 'Adler in the afternoon',
  'Адлер ночью': 'Adler at night',
  'Воронеж утром': 'Voronezh in the morning',
  'Воронеж днем': 'Voronezh in the afternoon',
  'Воронеж днём': 'Voronezh in the afternoon',
  'Воронеж ночью': 'Voronezh at night',
  'Санкт-Петербург утром': 'Saint Petersburg in the morning',
  'Санкт-Петербург днем': 'Saint Petersburg in the afternoon',
  'Санкт-Петербург днём': 'Saint Petersburg in the afternoon',
  'Санкт-Петербург ночью': 'Saint Petersburg at night',
  'Москва утром': 'Moscow in the morning',
  'Москва днем': 'Moscow in the afternoon',
  'Москва днём': 'Moscow in the afternoon',
  'Москва ночью': 'Moscow at night',
  'Казань утром': 'Kazan in the morning',
  'Казань днем': 'Kazan in the afternoon',
  'Казань днём': 'Kazan in the afternoon',
  'Казань ночью': 'Kazan at night',
  'Сочи утром': 'Sochi in the morning',
  'Сочи днем': 'Sochi in the afternoon',
  'Сочи днём': 'Sochi in the afternoon',
  'Сочи ночью': 'Sochi at night',
};

/* PAGE ELEMENTS */
const cardsList = document.querySelector('.content__list');
const cardsContainer = document.querySelector('.content__list-container');
const videoContainer = document.querySelector('.result__video-container');
const videoElement = document.querySelector('.result__video');
const form = document.querySelector('form');

/* TEMPLATES */
const cardTmp = document.querySelector('.cards-list-item-template');
const preloaderTmp = document.querySelector('.preloader-template');
const videoNotFoundTmp = document.querySelector('.error-template');
const moreButtonTmp = document.querySelector('.more-button-template');

/* MAIN LOGIC */

// Stores loaded cards for switching between videos
let cardsOnPageState = [];

// Initial load
showPreloader(preloaderTmp, videoContainer);
showPreloader(preloaderTmp, cardsContainer);
mainMechanics(endpoint);

// Search
form.onsubmit = (e) => {
  e.preventDefault();

  cardsList.textContent = '';

  const buttonInDOM = cardsContainer.querySelector('.more-button');

  if (buttonInDOM) {
    buttonInDOM.remove();
  }

  [...videoContainer.children].forEach((el) => {
    el.className === 'error' && el.remove();
  });

  showPreloader(preloaderTmp, videoContainer);
  showPreloader(preloaderTmp, cardsContainer);

  const formData = serializeFormData(form);

  const requestUrl = generateFilterRequest(
    endpoint,
    formData.city,
    formData.timeArray
  );

  mainMechanics(requestUrl);
};

/* MAIN DATA HANDLING FUNCTION */

async function mainMechanics(endpoint) {
  try {
    const data = await (await fetch(endpoint)).json();

    cardsOnPageState = data.results;

    if (!data?.results?.[0]) {
      throw new Error('not-found');
    }

    appendCards({
      baseUrl: BASE_URL,
      dataArray: data.results,
      cardTmp,
      container: cardsList,
    });

    setVideo({
      baseUrl: BASE_URL,
      video: videoElement,
      videoUrl: data.results[0].video.url,
      posterUrl: data.results[0].poster.url,
    });

    document
      .querySelectorAll('.content__card-link')[0]
      .classList.add('content__card-link_current');

    await waitForReadyVideo(videoElement);
    await delay(preloaderWaitindTime);

    removePreloader(videoContainer, '.preloader');
    removePreloader(cardsContainer, '.preloader');

    // Adds custom scrollbar styling
    cardsContainer.classList.add('custom-scrollbar');

    chooseCurrentVideo({
      baseUrl: BASE_URL,
      videoData: cardsOnPageState,
      cardLinksSelector: '.content__card-link',
      currentLinkClassName: 'content__card-link_current',
      mainVideo: videoElement,
    });

    showMoreCards({
      dataArray: data,
      buttonTemplate: moreButtonTmp,
      cardsList,
      buttonSelector: '.more-button',
      initialEndpoint: endpoint,
      baseUrl: BASE_URL,
      cardTmp: cardTmp,
    });
  } catch (err) {
    if (err.message === 'not-found') {
      showError(
        videoContainer,
        videoNotFoundTmp,
        'No matching videos found :('
      );
    } else {
      showError(
        videoContainer,
        videoNotFoundTmp,
        'Failed to load data :('
      );
    }

    console.log(err);

    removePreloader(videoContainer, '.preloader');
    removePreloader(cardsContainer, '.preloader');
  }
}

/* UTILITIES */

// Simple promise used to create a delay
async function delay(ms) {
  return await new Promise((resolve) => {
    return setTimeout(resolve, ms);
  });
}

// Resolves when the video is ready to play without interruption
async function waitForReadyVideo(video) {
  return await new Promise((resolve) => {
    video.oncanplaythrough = resolve;
  });
}

// Displays a preloader while data is loading
function showPreloader(tmp, parent) {
  const node = tmp.content.cloneNode(true);
  parent.append(node);

  console.log('Preloader displayed');
}

// Removes the preloader from the DOM
function removePreloader(parent, preloaderSelector) {
  const preloader = parent.querySelector(preloaderSelector);

  if (preloader) {
    preloader.remove();
  }

  console.log('Preloader removed');
}

// Returns an English city name when a translation is available
function translateCity(city) {
  return cityTranslations[city] || city;
}

// Returns an English description when a translation is available
function translateDescription(description) {
  if (descriptionTranslations[description]) {
    return descriptionTranslations[description];
  }

  let translatedDescription = description;

  Object.entries(cityTranslations).forEach(([russianCity, englishCity]) => {
    translatedDescription = translatedDescription.replace(
      russianCity,
      englishCity
    );
  });

  translatedDescription = translatedDescription
    .replace(/ночью/gi, 'at night')
    .replace(/ночной/gi, 'at night')
    .replace(/утром/gi, 'in the morning')
    .replace(/утренний/gi, 'in the morning')
    .replace(/днем/gi, 'in the afternoon')
    .replace(/днём/gi, 'in the afternoon')
    .replace(/дневной/gi, 'in the afternoon')
    .replace(/вечером/gi, 'in the evening')
    .replace(/вечерний/gi, 'in the evening');

  return translatedDescription;
}

// Creates and appends video cards using API data
function appendCards({ baseUrl, dataArray, cardTmp, container }) {
  dataArray.forEach((el) => {
    const node = cardTmp.content.cloneNode(true);

    const translatedCity = translateCity(el.city);
    const translatedDescription = translateDescription(el.description);

    node.querySelector('a').setAttribute('id', el.id);

    node.querySelector('.content__video-card-title').textContent =
      translatedCity;

    node.querySelector('.content__video-card-description').textContent =
      translatedDescription;

    node
      .querySelector('.content__video-card-thumbnail')
      .setAttribute('src', `${baseUrl}${el.thumbnail.url}`);

    node
      .querySelector('.content__video-card-thumbnail')
      .setAttribute('alt', translatedDescription);

    container.append(node);
  });

  console.log('Video cards generated');
}

// Sets the selected video in the main video container
function setVideo({ baseUrl, video, videoUrl, posterUrl }) {
  video.setAttribute('src', `${baseUrl}${videoUrl}`);
  video.setAttribute('poster', `${baseUrl}${posterUrl}`);

  console.log('Main video updated');
}

// Gets and serializes data from the search form
function serializeFormData(form) {
  const city = form.querySelector('input[name="city"]');

  const checkboxes = form.querySelectorAll(
    '.search-form__checkbox'
  );

  const checkedValuesArray = [...checkboxes].reduce((acc, item) => {
    item.checked && acc.push(item.value);
    return acc;
  }, []);

  console.log('Form data collected');

  return {
    city: city.value,
    timeArray: checkedValuesArray,
  };
}

// Generates an API request URL based on the selected filters
function generateFilterRequest(endpoint, city, timeArray) {
  if (city) {
    endpoint += `filters[city][$containsi]=${city}&`;
  }

  if (timeArray.length) {
    timeArray.forEach((timeslot) => {
      endpoint += `filters[time_of_day][$eqi]=${timeslot}&`;
    });
  }

  console.log('Filtered API request URL generated');

  return endpoint;
}

// Switches the currently selected video
function chooseCurrentVideo({
  baseUrl,
  videoData,
  cardLinksSelector,
  currentLinkClassName,
  mainVideo,
}) {
  const cardsList = document.querySelectorAll(cardLinksSelector);

  if (cardsList) {
    cardsList.forEach((item) => {
      item.onclick = async (e) => {
        e.preventDefault();

        cardsList.forEach((item) => {
          item.classList.remove(currentLinkClassName);
        });

        item.classList.add(currentLinkClassName);

        showPreloader(preloaderTmp, videoContainer);

        const videoObj = videoData.find(
          (video) => String(video.id) === String(item.id)
        );

        setVideo({
          baseUrl,
          video: mainVideo,
          videoUrl: videoObj.video.url,
          posterUrl: videoObj.poster.url,
        });

        await waitForReadyVideo(mainVideo);
        await delay(preloaderWaitindTime);

        removePreloader(videoContainer, '.preloader');

        console.log('Video switched');
      };
    });
  }
}

// Displays an error when no video is found
function showError(container, errorTemplate, errorMessage) {
  const node = errorTemplate.content.cloneNode(true);

  node.querySelector('.error__title').textContent = errorMessage;

  container.append(node);

  console.log('Error message displayed');
}

// Loads more videos when additional pagination pages are available
function showMoreCards({
  dataArray,
  buttonTemplate,
  cardsList,
  buttonSelector,
  initialEndpoint,
  baseUrl,
  cardTmp,
}) {
  if (dataArray.pagination.page === dataArray.pagination.pageCount) {
    return;
  }

  // Adds the "Show More" button
  const button = buttonTemplate.content.cloneNode(true);

  cardsContainer.append(button);

  // Selects the added button and attaches a click handler
  const buttonInDOM = cardsContainer.querySelector(buttonSelector);

  buttonInDOM.addEventListener('click', async () => {
    // Requests the next page of videos
    let currentPage = dataArray.pagination.page;

    let urlToFetch = `${initialEndpoint}pagination[page]=${(currentPage += 1)}&`;

    try {
      let data = await (await fetch(urlToFetch)).json();

      buttonInDOM.remove();

      cardsOnPageState = cardsOnPageState.concat(data.results);

      appendCards({
        baseUrl,
        dataArray: data.results,
        cardTmp,
        container: cardsList,
      });

      chooseCurrentVideo({
        baseUrl: BASE_URL,
        videoData: cardsOnPageState,
        cardLinksSelector: '.content__card-link',
        currentLinkClassName: 'content__card-link_current',
        mainVideo: videoElement,
      });

      showMoreCards({
        dataArray: data,
        buttonTemplate,
        cardsList,
        buttonSelector,
        initialEndpoint,
        baseUrl,
        cardTmp,
      });
    } catch (err) {
      return err;
    }
  });
}
