import React, {useMemo, useState} from 'react';
import {connect} from 'react-redux';
import {compose} from 'redux';
import { Dropdown } from 'react-bootstrap';
import {Link, Redirect} from 'react-router-dom';
import {signOut} from "../../services/actions/authActions";
import {firestoreConnect} from "react-redux-firebase";
import { Line } from 'rc-progress';
import moment from "moment";
import {getRanColor} from "../dashboard/Dashboard";

let itemCount = -1;

function Navbar(props) {
  const { pending_upload } = props;
  const [state, ] = useState({color: getRanColor(), percent: 1});

  const toggleOffcanvas = () => {
    document.querySelector('.sidebar-offcanvas').classList.toggle('active');
  }

  const logout = (e) => {
    e.preventDefault();
    props.signOut();
  }

  const user = useMemo(function() {
    const __user = localStorage.getItem('user') || false;
    const __name = localStorage.getItem('name') || 'User';

    return {__user, __name};
  }, []);

  if (!user.__user) {
    return (
        <Redirect to="/user-pages/login-1"/>
    )
  }

    return (
      <nav className="navbar p-0 fixed-top d-flex flex-row">
        <div className="navbar-brand-wrapper d-flex d-lg-none align-items-center justify-content-center">
          <Link className="navbar-brand brand-logo-mini"  to="/"><img src={"https://firebasestorage.googleapis.com/v0/b/poultry101-6b1ed.appspot.com/o/logo256.png?alt=media&token=25b09b36-23e6-4c62-9207-667d99541df4"} alt="logo" /></Link>
        </div>
        <div className="navbar-menu-wrapper flex-grow d-flex align-items-stretch">
          <button className="navbar-toggler align-self-center" type="button" onClick={ () => document.body.classList.toggle('sidebar-icon-only') }>
            <span className="mdi mdi-menu"/>
          </button>
          <ul className="navbar-nav w-100" />
          <ul className="navbar-nav navbar-nav-right">
            <li className="nav-item d-none d-lg-block">
              <a className="nav-link" href="!#" onClick={event => event.preventDefault()}>
                <i className="mdi mdi-view-grid"/>
              </a>
            </li>
            <Dropdown alignRight as="li" className="nav-item border-left">
              <Dropdown.Toggle as="a" className="nav-link count-indicator cursor-pointer">
                <i className="mdi mdi-bell"/>
                {pending_upload?.length > 0 && <span className="count bg-danger"/>}
              </Dropdown.Toggle>
              <Dropdown.Menu className="dropdown-menu navbar-dropdown preview-list">
                <h6 className="p-3 mb-0">Notifications</h6>
                <Dropdown.Divider />
                {
                  pending_upload?.length > 0 ? pending_upload.map((item) => {
                    if (pending_upload.length-1 > itemCount) itemCount++;
                    else itemCount = 0;
                    return (
                        <Dropdown.Item
                            key={item.id}
                            className="dropdown-item preview-item"
                            onClick={evt =>evt.preventDefault()}>
                          <div className="preview-thumbnail">
                            <div className="preview-icon bg-dark rounded-circle">
                              <i className="mdi mdi-cloud-upload text-success"/>
                            </div>
                          </div>
                          <div className="preview-item-content">
                            <p className="preview-subject mb-1">Uploading image submitted {moment(item.submittedOn.toDate()).fromNow()}</p>
                            <p className="text-muted ellipsis mb-0">
                                <Line
                                      percent={state.percent} strokeWidth="4" strokeColor={state.color} />
                                <Line
                                    percent={[state.percent / 2, state.percent / 2]}
                                    strokeWidth="4"
                                    strokeColor={[state.color, '#CCC']}
                                />
                            </p>
                          </div>
                        </Dropdown.Item>
                    )
                  }) :
                      <Dropdown.Item
                      className="dropdown-item preview-item"
                      onClick={evt =>evt.preventDefault()}>
                    <div className="preview-thumbnail">
                      <div className="preview-icon bg-dark rounded-circle">
                        <i className="mdi mdi-cloud-upload text-success"/>
                      </div>
                    </div>
                    <div className="preview-item-content">
                      <p className="preview-subject mb-1">You're all caught up!</p>
                      <p className="text-muted ellipsis mb-0">
                        No new Notifications
                      </p>
                    </div>
                  </Dropdown.Item>
                }
                <Dropdown.Divider />
              </Dropdown.Menu>
            </Dropdown>
            <Dropdown alignRight as="li" className="nav-item">
              <Dropdown.Toggle as="a" className="nav-link cursor-pointer no-caret">
                <div className="navbar-profile">
                  <img className="img-xs rounded-circle" src={"https://firebasestorage.googleapis.com/v0/b/poultry101-6b1ed.appspot.com/o/user.png?alt=media&token=e9a7afc0-27d9-4285-8e34-7b530b141c42"} alt="profile" />
                  <p className="mb-0 d-none d-sm-block navbar-profile-name">{user.__name}</p>
                  <i className="mdi mdi-menu-down d-none d-sm-block"/>
                </div>
              </Dropdown.Toggle>

              <Dropdown.Menu className="navbar-dropdown preview-list navbar-profile-dropdown-menu">
                <h6 className="p-3 mb-0">Profile</h6>
                <Dropdown.Divider />
                <Dropdown.Item href="!#" onClick={evt =>evt.preventDefault()}  className="preview-item">
                  <div className="preview-thumbnail">
                    <div className="preview-icon bg-dark rounded-circle">
                      <i className="mdi mdi-logout text-danger"/>
                    </div>
                  </div>
                  <div className="preview-item-content">
                    <p className="preview-subject mb-1" onClick={logout}>Log Out</p>
                  </div>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </ul>
          <button className="navbar-toggler navbar-toggler-right d-lg-none align-self-center" type="button" onClick={toggleOffcanvas}>
            <span className="mdi mdi-format-line-spacing"/>
          </button>
        </div>
      </nav>
    );
}

const mapStateToProps = function(state) {
  return {
    pending_upload: state.firestore.ordered.pending_upload
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    signOut: () => dispatch(signOut())
  }
}

export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    firestoreConnect([
      {collection: 'pending_upload', orderBy: ['submittedOn', 'asc']},
    ]))(Navbar);
