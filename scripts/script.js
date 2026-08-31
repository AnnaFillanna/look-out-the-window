/* CONFIG */
const preloaderWaitindTime = 1200;
const cardsOnPage = 5;
const BASE_URL = 'https://v-content.practicum-team.ru';
const endpoint = `${BASE_URL}/api/videos?pagination[pageSize]=${cardsOnPage}&`;

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

/* CITY TRANSLATIONS */
const cityTranslations = {
  'Санкт-Петербург': 'Saint Petersburg',
  'Москва': 'Moscow',
  'Белгород': 'Belgorod',
  'Адлер': 'Adler',
  'Воронеж': 'Voronezh',
  'Сочи': 'Sochi',
  'Казань': 'Kazan',
  'Самара': 'Samara',
  'Екатеринбург': 'Yekaterinburg',
  'Новосибирск': 'Novosibirsk',
  'Калининград': 'Kaliningrad',
  'Владивосток': 'Vladivostok',
  'Краснодар': 'Krasnodar',
  'Нижний Новгород': 'Nizhny Novgorod',
  'Ростов-на-Дону': 'Rostov-on-Don',
};

/* DESCRIPTION TRANSLATIONS */
const descriptionTranslations = {
  'Белгород ночью': 'Belgorod at night',
  'Белгород утром': 'Belgorod in the morning',
  'Белгород днем': 'Belgorod in the afternoon',
  'Белгород днём': 'Belgorod in the afternoon',

  'Адлер ночью': 'Adler at night',
  'Адлер утром': 'Adler in the morning',
  'Адлер днем': 'Adler in the afternoon',
  'Адлер днём': 'Adler in the afternoon',

  'Воронеж ночью': 'Voronezh at night',
  'Воронеж утром': 'Voronezh in the morning',
  'Воронеж днем': 'Voronezh in the afternoon',
  'Воронеж днём': 'Voronezh in the afternoon',

  'Санкт-Петербург ночью': 'Saint Petersburg at night',
  'Санкт-Петербург утром': 'Saint Petersburg in the morning',
  'Санкт-Петербург днем': 'Saint Petersburg in the afternoon',
  'Санкт-Петербург днём': 'Saint Petersburg in the afternoon',

  'Москва ночью': 'Moscow at night',
  'Москва утром': 'Moscow in the morning',
  'Москва днем': 'Moscow in the afternoon',
  'Москва днём': 'Moscow in the afternoon',

  'Сочи ночью': 'Sochi at night',
  'Сочи утром': 'Sochi in the morning',
  'Сочи днем': 'Sochi in the afternoon',
  'Сочи днём': 'Sochi in the afternoon',
};

/* HELPERS FOR API TEXT TRANSLATION */
function translateCity(city) {
  return cityTranslations[city] || city;
}

function translateDescription(description, city) {
  if (descriptionTranslations[description]) {
    return descriptionTranslations[description];
  }

  const translatedCity = translateCity(city);

  if (description.includes('утром')) {
    return `${translatedCity} in the morning`;
  }

  if (description.includes('ночью')) {
    return `${translatedCity} at night`;
  }

  if (description.includes('днем') || description.includes('днём')) {
    return `${translatedCity} in the afternoon`;
  }

  return description;
}

/* MAIN LOGIC */

// Stores all currently loaded cards
let cardsOnPageState = [];

// Initial load
showPreloader(preloaderTmp, videoContainer);
showPreloader(preloaderTmp, cardsContainer);
mainMechanics(endpoint);

// Search form submission
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

/* MAIN DATA HANDLER */

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
        'Error loading data :('
      );
    }

    console.log(err);

    removePreloader(videoContainer, '.preloader');
    removePreloader(cardsContainer, '.preloader');
  }
}

/* UTILITIES */

// Simple delay helper
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

// Shows a preloader while data is loading
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

// Creates and appends cards using API data
function appendCards({ baseUrl, dataArray, cardTmp, container }) {
  dataArray.forEach((el) => {
    const node = cardTmp.content.cloneNode(true);

    const translatedCity = translateCity(el.city);
    const translatedDescription = translateDescription(
      el.description,
      el.city
    );

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

  console.log('Cards generated');
}

// Sets the selected video in the main video container
function setVideo({ baseUrl, video, videoUrl, posterUrl }) {
  video.setAttribute('src', `${baseUrl}${videoUrl}`);
  video.setAttribute('poster', `${baseUrl}${posterUrl}`);

  console.log('Main video updated');
}

// Reads and serializes form data
function serializeFormData(form) {
  const city = form.querySelector('input[name="city"]');
  const checkboxes = form.querySelectorAll('input[name="time"]');

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

// Generates the API request URL using selected filters
function generateFilterRequest(endpoint, city, timeArray) {
  if (city) {
    endpoint += `filters[city][$containsi]=${city}&`;
  }

  if (timeArray) {
    timeArray.forEach((timeslot) => {
      endpoint += `filters[time_of_day][$eqi]=${timeslot}&`;
    });
  }

  console.log('API request URL generated');

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

  console.log('Error displayed');
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

  // Adds the "Show More" button after the cards
  const button = buttonTemplate.content.cloneNode(true);

  cardsContainer.append(button);

  // Finds the button in the DOM and adds a click listener
  const buttonInDOM = cardsContainer.querySelector(buttonSelector);

  buttonInDOM.addEventListener('click', async () => {
    // Requests the next page of videos
    let currentPage = dataArray.pagination.page;

    let urlToFetch = `${initialEndpoint}pagination[page]=${(currentPage += 1)}&`;

    try {
      const data = await (await fetch(urlToFetch)).json();

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
