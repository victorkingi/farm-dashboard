import React, {useState, Fragment, useEffect, useCallback} from 'react';
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import { withSnackbar } from "notistack";
import { Button } from "@material-ui/core";
import {connect} from 'react-redux';
import {compose} from 'redux';
import {withRouter} from 'react-router-dom';
import './App.scss';
import AppRoutes from './AppRoutes';
import Navbar from './app/shared/Navbar';
import Sidebar from './app/shared/Sidebar';
import {firebase, messaging} from "./services/api/fbConfig";
import {checkClaims} from "./services/actions/authActions";


function App(props) {
  const [state, setState] = useState({});
  const [state_, setState_] = useState();

  const updateServiceWorker = useCallback(() => {
    const { waitingWorker } = state;
    waitingWorker && waitingWorker.postMessage({ type: 'SKIP_WAITING' })
    setState({ newVersionAvailable: false });
    window.location.reload();
  }, [state]);

  const refreshAction = useCallback(() => { //render the snackbar button
    return (
        <Fragment>
          <Button
              className="snackbar-button"
              size="small"
              onClick={updateServiceWorker}
          >
            {"refresh"}
          </Button>
        </Fragment>
    );
  }, [updateServiceWorker]);

  const onServiceWorkerUpdate = registration => {
    setState({
      waitingWorker: registration && registration.waiting,
      newVersionAvailable: true
    });
  }

  const onRouteChanged = useCallback(() => {
    const body = document.querySelector('body');
    if(props.location.pathname === '/layout/RtlLayout') {
      body.classList.add('rtl');
    }
    else {
      body.classList.remove('rtl')
    }
    window.scrollTo(0, 0);
    const fullPageLayoutRoutes = ['/user-pages/login-1', '/user-pages/login-2', '/user-pages/register-1', '/user-pages/register-2', '/user-pages/lockscreen', '/error-pages/error-404', '/error-pages/error-500', '/general-pages/landing-page'];
    for ( let i = 0; i < fullPageLayoutRoutes.length; i++ ) {
      if (props.location.pathname === fullPageLayoutRoutes[i]) {
        setState_({
          isFullPageLayout: true
        })
        if (document.querySelector('.page-body-wrapper')) document
            .querySelector('.page-body-wrapper')
            .classList.add('full-page-wrapper');
        break;
      } else {
        setState_({
          isFullPageLayout: false
        })
        document.querySelector('.page-body-wrapper').classList.remove('full-page-wrapper');
      }
    }
  },
      [props.location.pathname]);

  const componentDidMount = useCallback(() => {
    onRouteChanged();
    if (messaging !== null) {
      navigator.serviceWorker.addEventListener("message", (message) => {
        if (message?.data) {
          const _data = `${message.data['firebase-messaging-msg-data'].data?.title}`;
          const _notification = `${message.data['firebase-messaging-msg-data']
              .notification?.title}: ${message.data['firebase-messaging-msg-data']
              .notification?.body}`;

          if (_data === 'undefined') {
           console.log(_notification);
          } else {
            console.log(_data);
          }
        }

      });
    }
    const { enqueueSnackbar } = props;
    const { newVersionAvailable } = state;

    if (process.env.NODE_ENV === 'production') {
      // If you want your app to work offline and load faster, you can change
      // unregister() to register() below. Note this comes with some pitfalls.
      // Learn more about service workers: https://cra.link/PWA
      serviceWorkerRegistration.register({ onUpdate: onServiceWorkerUpdate });
    }

    if (newVersionAvailable) {
      //show snackbar with refresh button
      enqueueSnackbar("A new version was released", {
        persist: true,
        variant: "success",
        action: refreshAction(),
      });
    }
  }, [props, state, refreshAction, onRouteChanged]);

  useEffect(() => {
    componentDidMount();

  }, [componentDidMount]);

  let navbarComponent = !state_?.isFullPageLayout ? <Navbar/> : '';
  let sidebarComponent = !state_?.isFullPageLayout ? <Sidebar/> : '';
  props.checkClaims();

  const componentDidUpdate = useCallback((prevProps) => {
    if (props.location !== prevProps.location) {
      return () => onRouteChanged();
    }
  }, [props.location, onRouteChanged]);

  useEffect(() => {
    const wait = (ms) => new Promise((res) => setTimeout(res, ms));
    const checkAuthState = () => {
      firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
          await wait(10000);
        } else {
          localStorage.clear();
          window.location.reload();
        }
      });
    }
    const callWithRetry = async (fn, depth = 0) => {
      try {
        await fn();
        await wait(2 ** depth * 10);
        return callWithRetry(fn, depth + 1);
      }catch(e) {
        console.log(e);
        if (depth > 7) {
          console.log("Big depth", e);
          throw e;
        }
      }
    }
    return () => callWithRetry(checkAuthState);
  }, []);

  useEffect(() => {
    return () => {
      componentDidMount();
      componentDidUpdate(props);
    }

  }, [props.location, componentDidMount, componentDidUpdate, props, onRouteChanged]);

  return (
      <div className="container-scroller">
        { sidebarComponent }
        <div className="container-fluid page-body-wrapper">
          { navbarComponent }
          <div className="main-panel">
            <div className="content-wrapper">
              <AppRoutes />
            </div>
          </div>
        </div>
      </div>
  );
}

const mapStateToProps = function(state) {
  return {
    auth: state.firebase.auth,
    admin: state.auth.admin
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    checkClaims: () => dispatch(checkClaims())
  }
}

export default compose(connect(mapStateToProps, mapDispatchToProps))(withRouter(withSnackbar(App)));
