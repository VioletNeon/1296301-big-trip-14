import EditingFormView from '../view/editing-form.js';
import WaypointView from '../view/waypoint.js';
import {render, replace, completelyRemove} from '../utils/render.js';
import {Mode, UserAction, UpdateType} from '../utils/const.js';
import {isOnline} from '../utils/common.js';
import {toast} from '../utils/toast.js';


export default class Point {
  constructor(waypointArguments) {
    const {container,
      destinationsModel,
      offersPointModel,
      changeData,
      changeMode,
      removeCreatingForm} = waypointArguments;
    this._container = container;
    this._destinationsModel = destinationsModel;
    this._offersPointModel = offersPointModel;
    this._changeData = changeData;
    this._changeMode = changeMode;
    this._removeCreatingForm = removeCreatingForm;

    this._waypointComponent = null;
    this._editingFormComponent = null;
    this._mode = Mode.DEFAULT;

    this._rollUpButtonClickHandler = this._rollUpButtonClickHandler.bind(this);
    this._rollDownButtonClickHandler = this._rollDownButtonClickHandler.bind(this);
    this._editingFormEscKeyDownHandler = this._editingFormEscKeyDownHandler.bind(this);
    this._editingFormSubmitHandler = this._editingFormSubmitHandler.bind(this);
    this._favoriteClickHandler = this._favoriteClickHandler.bind(this);
    this._buttonDeleteClickHandler = this._buttonDeleteClickHandler.bind(this);
  }

  init(point) {
    this._point = point;

    const previousWaypointComponent = this._waypointComponent;

    this._waypointComponent = new WaypointView(this._point);
    this._waypointComponent.setFavoriteClickHandler(this._favoriteClickHandler);
    this._waypointComponent.setRollUpButtonClickHandler(this._rollUpButtonClickHandler);

    if (previousWaypointComponent === null) {
      render(this._container, this._waypointComponent);
      return;
    }

    if (this._mode === Mode.DEFAULT) {
      replace(this._waypointComponent, previousWaypointComponent);
    }

    completelyRemove(previousWaypointComponent);
  }

  setViewState(state) {
    if (this._editingFormComponent === null) {
      return;
    }
    this._editingFormComponent.setFormState(state);
    this._destinationsModel.removeObserver();
    this._offersPointModel.removeObserver();
  }

  destroy() {
    completelyRemove(this._waypointComponent);
    completelyRemove(this._editingFormComponent);
  }

  resetView() {
    if (this._mode !== Mode.DEFAULT) {
      this._replaceEditingFormToWaypoint();
    }
  }

  _replaceWaypointToEditingForm() {
    replace(this._editingFormComponent, this._waypointComponent);
    this._changeMode();
    this._mode = Mode.EDITING;
  }

  _replaceEditingFormToWaypoint() {
    replace(this._waypointComponent, this._editingFormComponent);
    this._mode = Mode.DEFAULT;
    this._destinationsModel.removeObserver();
    this._offersPointModel.removeObserver();
  }

  _favoriteClickHandler() {
    this._changeData(
      UserAction.UPDATE_WAYPOINT,
      UpdateType.MINOR,
      Object.assign(
        {},
        this._point,
        {
          isFavorite: !this._point.isFavorite,
        },
      ),
    );
  }

  _editingFormEscKeyDownHandler(evt) {
    if (evt.key === 'Escape' || evt.key === 'Esc') {
      evt.preventDefault();
      this._editingFormComponent.reset(this._point);
      this._replaceEditingFormToWaypoint();
      document.removeEventListener('keydown', this._editingFormEscKeyDownHandler);
    }
  }

  _rollUpButtonClickHandler() {
    if (!isOnline()) {
      toast('You can\'t edit point offline');
      return;
    }

    this._editingFormComponent = new EditingFormView(this._point, this._destinationsModel, this._offersPointModel);
    this._editingFormComponent.setButtonDeleteClickHandler(this._buttonDeleteClickHandler);
    this._editingFormComponent.setRollDownButtonClickHandler(this._rollDownButtonClickHandler);
    this._editingFormComponent.setEditingFormSubmitHandler(this._editingFormSubmitHandler);
    this._editingFormComponent.setInnerHandlers();
    this._replaceWaypointToEditingForm();
    document.addEventListener('keydown', this._editingFormEscKeyDownHandler);
    this._removeCreatingForm();
  }

  _rollDownButtonClickHandler() {
    this._editingFormComponent.reset(this._point);
    this._replaceEditingFormToWaypoint();
    document.removeEventListener('keydown', this._editingFormEscKeyDownHandler);
  }

  _editingFormSubmitHandler(update) {
    if (!isOnline()) {
      toast('You can\'t save point offline');
      return;
    }

    this._changeData(
      UserAction.UPDATE_WAYPOINT,
      UpdateType.MINOR,
      update,
    );
    document.removeEventListener('keydown', this._editingFormEscKeyDownHandler);
  }

  _buttonDeleteClickHandler(point) {
    if (!isOnline()) {
      toast('You can\'t delete point offline');
      return;
    }

    this._changeData(
      UserAction.DELETE_WAYPOINT,
      UpdateType.MINOR,
      point,
    );
    document.removeEventListener('keydown', this._editingFormEscKeyDownHandler);
  }
}
