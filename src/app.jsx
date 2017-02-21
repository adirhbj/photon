/* global process:false */

'use strict';

require('./styles/base.scss');

const React = require('react');
const ReactDOM = require('react-dom');
const { Router, Route } = require('react-router');

const { createStore, applyMiddleware, combineReducers } = require('redux');
const { Provider } = require('react-redux');
const thunkMiddleware = require('redux-thunk');
const createLogger = require('redux-logger');
const { createHashHistory } = require('history');
const { syncReduxAndRouter, routeReducer, pushPath } = require('redux-simple-router');

const { getContent, loadUrl } = require('./components/actions.js');
const { getPage } = require('./components/utilities.js');
const data = require('./components/store.js');
const App = require('./components/App.jsx');
const reducer = combineReducers(Object.assign({},
  {data: data},
  {routing: routeReducer}
));

const loggerMiddleware = createLogger();
var createStoreWithMiddleware;
if (process.env.NODE_ENV === 'development') {
  createStoreWithMiddleware = applyMiddleware(
    thunkMiddleware, // lets us dispatch() functions
    loggerMiddleware // neat middleware that logs actions
  )(createStore);
} else {
  createStoreWithMiddleware = applyMiddleware(
    thunkMiddleware // lets us dispatch() functions
  )(createStore);
}

var store = createStoreWithMiddleware(reducer);

var history = createHashHistory({queryKey: false});
syncReduxAndRouter(history, store);


function onUpdate() {
  var {pages, text} = store.getState().data;
  var {path} = store.getState().routing;

  if( text ) {
    // We're already loading the content, so skip this update…
    return;
  }

  var page = getPage(path, pages);

  // If there's nothing, redirect to the first page.
  if (!page) {
    let url = '/' + pages[0].file;
    store.dispatch(pushPath(url));
    return;
  }

  // If we got a page, load its content.
  let data = page;
  if (data.url) {
    loadUrl(store.dispatch, data.url);
  } else {
    getContent(store.dispatch, data.file);
  }
}

ReactDOM.render((<Provider store={store}>
    <Router history={history}
        onUpdate={onUpdate}
    >
      <Route component={App}
          path="*"
      />
    </Router>
  </Provider>),
  document.querySelector('#mount'));

window.addEventListener("message", function (event) {
  if (event.data === 'whimsy:enabled') {
    document.querySelector('body').classList.add('whimsical');
  }
}, false);
