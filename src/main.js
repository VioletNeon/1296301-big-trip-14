import TripPresenter from './presenter/trip.js';
import PointsModel from './model/points.js';
import OffersModel from './model/offers.js';
import DestinationsModel from './model/destinations.js';
import Api from './api/api.js';
import FilterModel from './model/filter.js';
import FilterPresenter from './presenter/filter.js';
import SiteMenuView from './view/site-menu.js';
import StatsView from './view/statistics.js';
import {render, completelyRemove} from './utils/render.js';
import {MenuItem, UpdateType} from './utils/const.js';
import Store from './api/store.js';
import Provider from './api/provider.js';

const AUTHORIZATION = 'Basic jdHk3ll7GFjXs98hjt';
const END_POINT = 'https://14.ecmascript.pages.academy/big-trip';
const STORE_PREFIX = 'taskmanager-localstorage';
const STORE_VER = 'v14';
const STORE_NAME = `${STORE_PREFIX}-${STORE_VER}`;

const mainEventsContainer = document.querySelector('main .page-body__container');
const headerContainer = document.querySelector('.page-header__container');
const tripNavigation = headerContainer.querySelector('.trip-controls__navigation');
const tripFilter = headerContainer.querySelector('.trip-controls__filters');

const api = new Api(END_POINT, AUTHORIZATION);

const store = new Store(STORE_NAME, window.localStorage);
const apiWithProvider = new Provider(api, store);

const pointsModel = new PointsModel();
const offersModel = new OffersModel();
const destinationsModel = new DestinationsModel();
const filterModel = new FilterModel();

const siteMenuComponent = new SiteMenuView();

const tripPresenterArguments = {
  headerContainer: headerContainer,
  mainContainer: mainEventsContainer,
  destinationsModel,
  offersModel,
  pointsModel,
  filterModel,
  apiWithProvider,
};

const tripPresenter = new TripPresenter(tripPresenterArguments);
const filterPresenter = new FilterPresenter(tripFilter, filterModel, pointsModel);
let currentMenuItem = MenuItem.TABLE;
let statsComponent = null;

const siteMenuClickHandler = (menuItem) => {
  if (currentMenuItem === menuItem) {
    return;
  }
  currentMenuItem = menuItem;

  switch (menuItem) {
    case MenuItem.TABLE:
      completelyRemove(statsComponent);
      statsComponent = null;
      tripPresenter.init();
      siteMenuComponent.setMenuItem(menuItem);
      break;
    case MenuItem.STATS:
      statsComponent = new StatsView();
      tripPresenter.destroy();
      render(mainEventsContainer, statsComponent);
      statsComponent.setCharts(pointsModel.getDataItems());
      siteMenuComponent.setMenuItem(menuItem);
      break;
  }
};

filterPresenter.init();
tripPresenter.init();

apiWithProvider.getPoints()
  .then((points) => {
    pointsModel.setDataItems(UpdateType.INIT, points);
    render(tripNavigation, siteMenuComponent);
    siteMenuComponent.setMenuClickHandler(siteMenuClickHandler);
  })
  .catch(() => {
    pointsModel.setDataItems(UpdateType.INIT, []);
    render(tripNavigation, siteMenuComponent);
    siteMenuComponent.setMenuClickHandler(siteMenuClickHandler);
  });

api.getOffers().then((offers) => {
  offersModel.setDataItems(UpdateType.INIT, offers);
})
  .catch(() => {
    offersModel.setDataItems(UpdateType.INIT, []);
  });

api.getDestinations().then((destinations) => {
  destinationsModel.setDataItems(UpdateType.INIT, destinations);
})
  .catch(() => {
    destinationsModel.setDataItems(UpdateType.INIT, []);
  });

window.addEventListener('load', () => {
  navigator.serviceWorker.register('/sw.js');
});

window.addEventListener('online', () => {
  document.title = document.title.replace(' [offline]', '');
  apiWithProvider.sync();
});

window.addEventListener('offline', () => {
  document.title += ' [offline]';
});
