import React, {useState, useMemo} from 'react';
import {Link, Redirect} from 'react-router-dom';
import {Button, Form, Spinner } from 'react-bootstrap';
import {connect} from 'react-redux';
import {firebase, firestore, functions, messaging} from '../../services/api/fbConfig';
import {signIn} from "../../services/actions/authActions";
import Snackbar from "@material-ui/core/Snackbar";
import {Alert} from "../form-elements/InputEggs";
import {Offline} from 'react-detect-offline';

function Login(props) {
  const [state, setState] = useState({});
  const [open, setOpen] = useState(false);
  const [openError, setOpenError] = useState(false);
  const [error, setError] = useState('');
  const [openMess, setOpenMess] = useState('Logged in');
  const load = document.getElementById("loading");
  const submit = document.getElementById("login");
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
    setOpenError(false);
  };

  const sendTokenToServer = (token) => {
      const batch = firestore.batch();
      const fullName = firebase.auth().currentUser.displayName;
      const name = fullName.substring(0, fullName.lastIndexOf(" ")).toUpperCase();
      const email = firebase.auth().currentUser.email;

      if (name) {
        const docRef = firestore.collection("notify_token").doc(name);
        const tokenRef = docRef.collection("tokens").doc(token);
        const checkCount = docRef.collection("tokens").doc("count");
        checkCount.get().then((doc) => {
          if (!doc.exists) {
            batch.set(checkCount, {
              total: 0,
              submittedOn: new Date()
            });
          }
          batch.set(docRef, {
            submittedOn: new Date()
          });
          batch.set(tokenRef, {
            token,
            email,
            submittedOn: new Date()
          });

          batch.commit().then(() => {
            setOpenError(false);
            setOpenMess(`Token generated, sending to server...`);
            setOpen(true);
            const firstNotification = functions.httpsCallable('util-enabledNotify');
            firstNotification({token}).then(() => {
              window.location.reload();
            }).catch((err) => {
              setOpen(false);
              setError(`${err.message || 'Unknown error occurred. Probably internet connection'}`);
              setOpenError(true);
              submit.style.display = 'block';
              load.style.display = 'none';
            });
          }).catch((err) => {
            setOpen(false);
            setError(`${err.message}`);
            setOpenError(true);
            submit.style.display = 'block';
            load.style.display = 'none';
          });
        }).catch((err) => {
          setOpen(false);
          setError(`${err.message}. Failed to subscribe`);
          setOpenError(true);
          submit.style.display = 'block';
          load.style.display = 'none';
        });
      }
  }

  const handleToken = (sendTokenToServer_) => {
    const load = document.getElementById("loading");
    const submit = document.getElementById("login");

    if (messaging !== null) {
      messaging.requestPermission()
          .then(async function () {
            const token = await messaging.getToken();
            sendTokenToServer_(token);
          })
          .catch(function (err) {
            setOpen(false);
            setError("Unable to get permission to notify."+err);
            setOpenError(true);
            submit.style.display = 'block';
            load.style.display = 'none';
          });
      messaging.onTokenRefresh(() => {
        messaging.getToken().then((refreshedToken) => {
          console.log('Token refreshed.');
          sendTokenToServer_(refreshedToken);
        }).catch((err) => {
          setOpen(false);
          setError(`Unable to retrieve messaging token ${err.message} uncheck box to continue`);
          setOpenError(true);
          submit.style.display = 'block';
          load.style.display = 'none';
        });
      });
    } else {
      setOpen(false);
      setError('This browser does not support push notifications, please uncheck the box');
      setOpenError(true);
      submit.style.display = 'block';
      load.style.display = 'none';
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;

    if (!emailRegex.test(state.email)) {
      setError('Invalid email format');
      setOpenError(true);
      return;
    }
    if (!passRegex.test(state.password)) {
      setError('Password requires at least 1 uppercase, lowercase, numeric and special character and at least 8 characters long');
      setOpenError(true);
      return;
    }
    if (state.email && state.password) {
      submit.style.display = 'none';
      load.style.display = 'block';

      firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
          .then(() => {
            return firebase.auth().signInWithEmailAndPassword(
                state.email,
                state.password
            ).then((prof) => {
              props.signIn(prof);
              setOpenError(false);
              setOpenMess('Logged in');
              setOpen(true);
              if (state.notify) {
                handleToken(sendTokenToServer);
              } else {
                window.location.reload();
              }
            });
          })
          .catch((err) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            let errorM = errorCode && errorMessage ? `${errorCode}: ${errorMessage}` : `Login failed: probably incorrect password`;
            props.signIn(null, err);
            submit.style.display = 'block';
            load.style.display = 'none';
            setError(errorM);
            setOpenError(true);
      });
    }

  }

  const user = useMemo(() => {
    const __user = localStorage.getItem('user') || false;

    return {__user};
  }, []);

  if (user.__user) {
    return (
        <Redirect to="/"/>
    )
  }

  const handleChange = (e) => {
    if (e.target?.value === '0') {
      if (e.target.id === 'paid' || e.target.id === 'not_paid') {
        const paid = document.getElementById('paid').checked;
        const not_paid = document.getElementById('not_paid').checked;
        setState({
          ...state,
          paid,
          not_paid
        });
      } else {
        setState({
          ...state,
          [e.target.id]: e.target.checked
        });
      }
    } else {
      setState({
        ...state,
        [e.target.id]: e.target.value
      });
    }
  }

  const handleForgotPass = (e) => {
    e.preventDefault();
    submit.style.display = 'none';
    load.style.display = 'block';
    const auth = firebase.auth();
    if (emailRegex.test(state.email)) {
      auth.sendPasswordResetEmail(state.email).then(function () {
        setOpenError(false);
        setOpenMess('Reset email Sent, check your email.');
        setOpen(true);
        submit.style.display = 'block';
        load.style.display = 'none';
      }).catch((error) => {
        setError(error.message);
        setOpenError(true);
        submit.style.display = 'block';
        load.style.display = 'none';
      });
    } else {
      setError('Invalid email format');
      setOpenError(true);
      submit.style.display = 'block';
      load.style.display = 'none';
    }
  }

    return (
      <div>
        <div className="d-flex align-items-center auth px-0">
          <div className="row w-100 mx-0">
            <div className="col-lg-4 mx-auto">
              <div className="card text-left py-5 px-4 px-sm-5">
                <h3 className="font-weight-light">Sign in to continue.</h3>
                <Form className="pt-3">
                  <Form.Group className="d-flex search-field">
                    <Form.Control
                        type="email"
                        placeholder="Email"
                        id="email"
                        size="lg"
                        onChange={handleChange}
                        className="h-auto"
                    />
                  </Form.Group>
                  <Form.Group className="d-flex search-field">
                    <Form.Control id="password" type="password" placeholder="Password" onChange={handleChange} size="lg" className="h-auto" />
                  </Form.Group>
                  <div className="mt-3">
                    <Button
                        className="btn btn-block btn-primary btn-lg font-weight-medium auth-form-btn"
                        on="true" onClick={handleSubmit} id="login">SIGN IN</Button>
                  </div>
                  <div className="mt-3">
                    <Button style={{display: 'none'}} id="loading" variant="primary" className="btn btn-block btn-primary btn-lg font-weight-medium auth-form-btn" disabled>
                      <Spinner
                          as="span"
                          animation="grow"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                      />
                      <span className="sr-only">Loading...</span>
                    </Button>
                  </div>
                  <div className="my-2 d-flex justify-content-between align-items-center">
                    <div className="form-check">
                      <label htmlFor="notify" className="form-check-label text-muted">
                        <input type="checkbox" onChange={handleChange} className="form-check-input" id="notify" name="notify" defaultValue={0} />
                        <i className="input-helper"/>
                        I want to receive notifications
                      </label>
                    </div>
                    <a href="!#" onClick={handleForgotPass} className="auth-link text-muted">Forgot password?</a>
                  </div>
                  <div className="text-center mt-4 font-weight-light">
                    Don't have an account?
                    <Link to="/user-pages/register-1" className="text-primary"> Create</Link>
                  </div>
                </Form>
              </div>
            </div>
          </div>
        </div>
        <Offline>
          <Snackbar open={true} autoHideDuration={4000} onClose={handleClose}>
            <Alert severity="warning">Oops no internet connection detected cannot login!</Alert>
          </Snackbar>
        </Offline>
        <Snackbar open={open} autoHideDuration={4000} onClose={handleClose}>
          <Alert onClose={handleClose} severity="success">
            {openMess}
          </Alert>
        </Snackbar>
        <Snackbar open={openError} autoHideDuration={4000} onClose={handleClose}>
          <Alert severity="error">{error}!</Alert>
        </Snackbar>
      </div>
    )
}

const mapStateToProps = (state) => {
  return {
    authError: state.auth.authError
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    signIn: (creds) => dispatch(signIn(creds))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Login)
