import React, { useState, useMemo }  from 'react';
import {Link, Redirect} from 'react-router-dom';
import {Button, Form} from 'react-bootstrap';
import {connect} from 'react-redux';
import {firebase} from '../../services/api/firebase configurations/fbConfig';
import {signIn} from "../../services/actions/authActions";
import {sendTokenToServer} from "../../services/actions/chickenAction";
import {handleToken} from "../../services/actions/utilAction";

function validateEmail(mail) {
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(mail);

}

function Login(props) {
  const [state, setState] = useState({});
  const load = document.getElementById("loading");
  const submit = document.getElementById("login");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (state.email && state.password) {
      submit.style.display = 'none';
      load.style.display = 'block';
      firebase.auth().signInWithEmailAndPassword(
          state.email,
          state.password
      ).then((user) => {
        props.signIn(user);
        handleToken(props.sendTokenToServer);
      }).catch((err) => {
        props.signIn(null, err);
        submit.style.display = 'block';
        load.style.display = 'none';
      });
    }

  }
  const {authError} = props;

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
    const auth = firebase.auth();
    if (validateEmail(state.email)) {
      submit.style.display = 'none';
      load.style.display = 'block';
      auth.sendPasswordResetEmail(state.email).then(function () {
        alert("Reset email Sent, check your email.");
        submit.style.display = 'block';
        load.style.display = 'none';
      }).catch(function (error) {
        submit.style.display = 'block';
        load.style.display = 'none';
        alert(`ERROR: ${error}`);
      });
    }
  }
  console.log(state)

    return (
      <div>
        <div className="d-flex align-items-center auth px-0">
          <div className="row w-100 mx-0">
            <div className="col-lg-4 mx-auto">
              <div className="card text-left py-5 px-4 px-sm-5">
                <h3 className="font-weight-light">Sign in to continue.</h3>
                <Form className="pt-3">
                  <Form.Group className="d-flex search-field">
                    <Form.Control type="email" placeholder="Email" size="lg" onChange={handleChange} className="h-auto" />
                  </Form.Group>
                  <Form.Group className="d-flex search-field">
                    <Form.Control type="password" placeholder="Password" onChange={handleChange} size="lg" className="h-auto" />
                  </Form.Group>
                  <div className="mt-3">
                    <Button className="btn btn-block btn-primary btn-lg font-weight-medium auth-form-btn" on="true" onClick={handleSubmit}>SIGN IN</Button>
                  </div>
                  <div className="my-2 d-flex justify-content-between align-items-center">
                    <div className="form-check">
                      <label htmlFor="replaced" className="form-check-label text-muted">
                        <input type="checkbox" onChange={handleChange} className="form-check-input" id="replaced" name="replaced" defaultValue={0} />
                        <i className="input-helper"></i>
                        I want to receive notifications
                      </label>
                    </div>
                    <a href="!#" onClick={handleForgotPass} className="auth-link text-muted">Forgot password?</a>
                  </div>
                  <div className="text-center mt-4 font-weight-light">
                    Don't have an account? <Link to="/user-pages/register-1" className="text-primary">Create</Link>
                  </div>
                </Form>
              </div>
            </div>
          </div>
        </div>  
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
    signIn: (creds) => dispatch(signIn(creds)),
    sendTokenToServer: (token) => dispatch(sendTokenToServer(token))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Login)
