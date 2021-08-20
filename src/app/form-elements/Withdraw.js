import React, { useEffect, useState } from 'react';
import { Form } from 'react-bootstrap';
import {connect} from 'react-redux';
import bsCustomFileInput from 'bs-custom-file-input';
import {Redirect} from "react-router-dom";
import Snackbar from "@material-ui/core/Snackbar";
import {Alert} from "./InputEggs";
import {sendMoney} from "../../services/actions/moneyAction";
import {Offline, Online} from "react-detect-offline";
import {firebase} from '../../services/api/fbConfig';

function Withdraw(props) {
    const [state, setState] = useState({
        from: 'From',
        to: 'To',
        category: 'send'
    });
    const [open, setOpen] = useState(false);
    const [openError, setOpenError] = useState(false);
    const [redirect, setRedirect] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const priceAmountRegex = /^([\d]+)$/;
        const noZeroRegex = /^(0*)$/;
        const arr = Object.entries(state);

        for (let i = 0; i < arr.length; i++) {
            if (arr[i][0] === "amount") {
                if (!priceAmountRegex.test(arr[i][1])) {
                    setError('Money to send cannot be negative');
                    setOpenError(true);
                    return;
                }
                if (noZeroRegex.test(arr[i][1])) {
                    setError('Money to send cannot be zero');
                    setOpenError(true);
                    return;
                }
                break;
            }
        }
        firebase.auth().onAuthStateChanged((user_) => {
            if (user_) {
                state.name = user_
                    .displayName.substring(0,
                        user_.displayName.lastIndexOf(' ')).toUpperCase();
                state.receiver = `WITHDRAW_${state.name}`;
                delete state.from;
                delete state.to;

                const user = firebase.auth().currentUser;
                const credential = firebase.auth.AuthCredential
                    .fromJSON({ email: user_.email, password: state.pass })
                user.reauthenticateWithCredential(credential)
                    .then(() => {
                        delete state.pass;
                        props.sendMoney(state);
                        setOpenError(false);
                        setOpen(true);
                    }).catch((error) => {
                    setError(error.message.substring(0, error.message.lastIndexOf('.')));
                    setOpenError(true);
                    return -1;
                })
            } else {
                console.log("signed out")
                setError('User signed out');
                setOpenError(true);
                return -1;
            }
        });
    };

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
        setOpenError(false);
    };

    const handleSelect = (e) => {
        if (e.target) {
            setState({
                ...state,
                [e.target.id]: e.target.value
            });
        }
    }

    const componentDidMount = () => {
        bsCustomFileInput.init()
    }
    useEffect(() => {
        componentDidMount();
    }, []);

    if (redirect) {
        return (
            <Redirect to='/'/>
        )
    }
    return (
        <div>
            <div className="page-header">
                <h3 className="page-title">Withdraw</h3>
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item"><a style={{textDecoration: 'none'}} href="!#" onClick={event => {
                            event.preventDefault();
                            setRedirect(true);
                        }}>Home</a></li>
                        <li className="breadcrumb-item active" aria-current="page">Withdraw</li>
                    </ol>
                </nav>
            </div>
            <div className="col-xl grid-margin stretch-card">
                <div className="card">
                    <div className="card-body">
                        <h4 className="card-title">Withdraw</h4>
                        <p className="card-description"> Enter withdrawal amount </p>
                        <form className="forms-sample">
                            <Form.Group>
                                <label htmlFor="amount">Amount</label>
                                <Form.Control type="number" onChange={handleSelect} className="form-control" id="amount" placeholder="Enter Amount" />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="amount">Re-enter Password</label>
                                <Form.Control type="password" onChange={handleSelect} className="form-control" id="pass" placeholder="Enter User Password" />
                            </Form.Group>
                            <button type="submit" className="btn btn-primary mr-2" onClick={handleSubmit}>Submit</button>
                        </form>
                    </div>
                </div>
            </div>
            <Online>
                <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
                    <Alert onClose={handleClose} severity="success">
                        Data Submitted
                    </Alert>
                </Snackbar>
            </Online>
            <Offline>
                <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
                    <Alert onClose={handleClose} severity="error">
                        Withdrawing requires user to be online for reauthentication
                    </Alert>
                </Snackbar>
            </Offline>
            <Snackbar open={openError} autoHideDuration={6000} onClose={handleClose}>
                <Alert severity="error">{error}!</Alert>
            </Snackbar>
        </div>
    )
}

const mapDispatchToProps = (dispatch) => {
    return {
        sendMoney: (money) => dispatch(sendMoney(money))
    }
}

export default connect(null, mapDispatchToProps)(Withdraw);
