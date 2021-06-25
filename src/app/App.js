import React, {useEffect, useState} from 'react';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {withRouter} from 'react-router-dom';
import {toast, ToastContainer} from "react-toastify";
import './App.scss';
import AppRoutes from './AppRoutes';
import Navbar from './shared/Navbar';
import Sidebar from './shared/Sidebar';
import {firebase, messaging} from "../services/api/firebase configurations/fbConfig";
import {checkClaims} from "../services/actions/authActions";

function App(props) {
  const [state, setState] = useState();
  let navbarComponent = !state?.isFullPageLayout ? <Navbar/> : '';
  let sidebarComponent = !state?.isFullPageLayout ? <Sidebar/> : '';
  props.checkClaims();

  const componentDidMount = () => {
    onRouteChanged();
    if (messaging !== null) {
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
  }

  const componentDidUpdate = (prevProps) => {
    if (props.location !== prevProps.location) {
      return () => onRouteChanged();
    }
  }

  useEffect(() => {
    const wait = (ms) => new Promise((res) => setTimeout(res, ms));
    const checkAuthState = () => {
      firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
          await wait(10000);
        } else {
          localStorage.removeItem('user');
          await wait(10000);
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

  const onRouteChanged = () => {
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
        setState({
          isFullPageLayout: true
        })
        if (document.querySelector('.page-body-wrapper')) document
            .querySelector('.page-body-wrapper')
            .classList.add('full-page-wrapper');
        break;
      } else {
        setState({
          isFullPageLayout: false
        })
        document.querySelector('.page-body-wrapper').classList.remove('full-page-wrapper');
      }
    }
  }

  useEffect(() => {
    return () => {
      componentDidMount();
      componentDidUpdate(props);
    }

  }, [props]);


  return (
        <div>
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
          <div className="container-scroller">
            { sidebarComponent }
            <div className="container-fluid page-body-wrapper">
              { navbarComponent }
              <div className="main-panel">
                <div className="content-wrapper">
                  <AppRoutes/>
                </div>
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

export default compose(connect(mapStateToProps, mapDispatchToProps))(withRouter(App));
