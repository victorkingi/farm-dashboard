import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { SnackbarProvider } from "notistack";
import {applyMiddleware, compose, createStore} from 'redux';
import {Provider} from 'react-redux';
import thunk from 'redux-thunk';
import {createFirestoreInstance, getFirestore, reduxFirestore} from 'redux-firestore';
import {getFirebase, ReactReduxFirebaseProvider} from 'react-redux-firebase';
import rootReducer from "./services/reducers/rootReducer";
import {firebase} from "./services/api/fbConfig";
import { BrowserRouter } from 'react-router-dom';
import reportWebVitals from "./reportWebVitals";

const store = createStore(rootReducer,
    compose(
        applyMiddleware(thunk.withExtraArgument({getFirebase, getFirestore})),
        reduxFirestore(firebase)
    )
);

const rrfConfig = {
    userProfile: 'users',
    useFirestoreForProfile: true
}
const rrfProps = {
    firebase,
    config: rrfConfig,
    dispatch: store.dispatch,
    createFirestoreInstance,

}

ReactDOM.render(
  <React.StrictMode>
      <Provider store={store}>
          <ReactReduxFirebaseProvider {...rrfProps}>
              <SnackbarProvider>
                  <BrowserRouter>
                      <App />
                  </BrowserRouter>
              </SnackbarProvider>
          </ReactReduxFirebaseProvider>
      </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);

reportWebVitals();
