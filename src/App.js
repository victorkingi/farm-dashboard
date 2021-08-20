import React, {useState, useEffect, useCallback} from 'react';
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
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
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Snackbar from '@material-ui/core/Snackbar';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Slide from '@material-ui/core/Slide';

function componentDidMount_() {
  navigator.serviceWorker.addEventListener("message", (message) => {
    const customId = "myToast";
    if (message?.data) {
      const _data = `${message.data['firebase-messaging-msg-data'].data?.title}`;
      const _notification = `${message.data['firebase-messaging-msg-data']
          .notification?.title}: ${message.data['firebase-messaging-msg-data']
          .notification?.body}`;

      if (_data === 'undefined') {
        toast.info(_notification, {
          toastId: customId,
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      } else {
        toast.info(_data, {
          toastId: customId,
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      }
    }

  });
}

function TransitionUp(props) {
  return <Slide {...props} direction="up" />;
}

function App(props) {
  const [state, setState] = useState({});
  const [state_, setState_] = useState();
  const [open, setOpen] = React.useState(false);
  const [transition, setTransition] = React.useState(undefined);

  const updateServiceWorker =() => {
    const { waitingWorker } = state;
    waitingWorker && waitingWorker.postMessage({ type: 'SKIP_WAITING' })
    setState({ newVersionAvailable: false });
    window.location.reload();
  };

  const onServiceWorkerUpdate = registration => {
    console.log("updated")
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
  }, [props.location.pathname]);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpen(false);
    updateServiceWorker();
  };

  useEffect(() => {
    const componentDidMount = () => {
      onRouteChanged();
      const { newVersionAvailable } = state;

      if (newVersionAvailable) {
        //show snackbar with refresh button
        setTransition(() => TransitionUp);
        setOpen(true);
      }

      if (process.env.NODE_ENV === 'production') {
        // If you want your app to work offline and load faster, you can change
        // unregister() to register() below. Note this comes with some pitfalls.
        // Learn more about service workers: https://cra.link/PWA
        serviceWorkerRegistration.register({ onUpdate: onServiceWorkerUpdate });
      }
    };

    componentDidMount();

  }, [onRouteChanged, state]);

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
      componentDidUpdate(props);
    }

  }, [props.location, componentDidUpdate, props, onRouteChanged]);

  useEffect(() => {
    if (messaging !== null) {
      componentDidMount_();
    }
  }, []);

  return (
        <div className="container-scroller">
          <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
          />
          { sidebarComponent }
          <div className="container-fluid page-body-wrapper">
            { navbarComponent }
              <div className="main-panel">
                <div className="content-wrapper">
                  <AppRoutes />
                </div>
              </div>
          </div>
          <Snackbar
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
              }}
              TransitionComponent={transition}
              open={open}
              onClose={handleClose}
              message="🐣 New version was released!"
              action={
                <React.Fragment>
                  <Button color="secondary" size="small" onClick={handleClose}>
                    Update
                  </Button>
                  <IconButton size="small" aria-label="close" color="inherit" onClick={handleClose}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </React.Fragment>
              }
          />
        </div>
  );
}

const mapDispatchToProps = (dispatch) => {
  return {
    checkClaims: () => dispatch(checkClaims())
  }
}

export default compose(connect(null, mapDispatchToProps))(withRouter(App));
