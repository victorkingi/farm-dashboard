import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import {toast, ToastContainer} from "react-toastify";
import './App.scss';
import AppRoutes from './AppRoutes';
import Navbar from './shared/Navbar';
import Sidebar from './shared/Sidebar';
import {messaging} from "../services/api/firebase configurations/fbConfig";

class App extends Component {
  state = {}
  componentDidMount() {
    this.onRouteChanged();
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
  render () {
    let navbarComponent = !this.state.isFullPageLayout ? <Navbar/> : '';
    let sidebarComponent = !this.state.isFullPageLayout ? <Sidebar/> : '';
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

  componentDidUpdate(prevProps) {
    if (this.props.location !== prevProps.location) {
      this.onRouteChanged();
    }
  }

  onRouteChanged() {
    console.log("ROUTE CHANGED");
    const body = document.querySelector('body');
    if(this.props.location.pathname === '/layout/RtlLayout') {
      body.classList.add('rtl');
    }
    else {
      body.classList.remove('rtl')
    }
    window.scrollTo(0, 0);
    const fullPageLayoutRoutes = ['/user-pages/login-1', '/user-pages/login-2', '/user-pages/register-1', '/user-pages/register-2', '/user-pages/lockscreen', '/error-pages/error-404', '/error-pages/error-500', '/general-pages/landing-page'];
    for ( let i = 0; i < fullPageLayoutRoutes.length; i++ ) {
      if (this.props.location.pathname === fullPageLayoutRoutes[i]) {
        this.setState({
          isFullPageLayout: true
        })
        document.querySelector('.page-body-wrapper').classList.add('full-page-wrapper');
        break;
      } else {
        this.setState({
          isFullPageLayout: false
        })
        document.querySelector('.page-body-wrapper').classList.remove('full-page-wrapper');
      }
    }
  }

}

export default withRouter(App);
