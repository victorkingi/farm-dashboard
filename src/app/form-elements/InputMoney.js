import React, { useEffect, useState } from 'react';
import { Form } from 'react-bootstrap';
import {connect} from 'react-redux';
import bsCustomFileInput from 'bs-custom-file-input';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown'
import {Redirect} from "react-router-dom";
import Snackbar from "@material-ui/core/Snackbar";
import {Alert} from "./InputEggs";
import {sendMoney} from "../../services/actions/moneyAction";
import {Offline, Online} from "react-detect-offline";
import {firebase} from '../../services/api/fbConfig';
import DatePicker from "react-datepicker";
import {compose} from "redux";
import {firestoreConnect} from "react-redux-firebase";


const cleanSendReceive = (str, name) => {
    let str1 = str.toUpperCase();
    if (str.includes('From')) return str1.slice(4);
    else if (str.includes('To')) return str1.slice(2);
    else if (str.includes('Me')) return name;
    return str1;
}

function InputMoney(props) {
    const { extraData } = props;

    const [state, setState] = useState({
        from: 'From',
        to: 'To',
        category: 'trades',
        date: new Date(),
        extra_data: ''
    });
    const [open, setOpen] = useState(false);
    const [openError, setOpenError] = useState(false);
    const [redirect, setRedirect] = useState(false);
    const [error, setError] = useState('');
    const [groups, setGroups] = useState([]);

    useEffect(() => {
        if (extraData) {
          setGroups(Object.values(extraData[0].groups || {}) || []);
        }
      }, [extraData]);

    const parameterSendingChecks = (values) => {
        if (values.name === values.receiver) {
            setError('Cannot send money to yourself');
            setOpenError(true);
            return false;
        }
        if (values.amount < 1) {
            setError('Invalid amount');
            setOpenError(true);
            return false;
        }
        if (!values.name) {
            setError('Sender undefined');
            setOpenError(true);
            return false;
        }
        if (!values.initiator) {
            setError('User undefined');
            setOpenError(true);
            return false;
        }
        return checkDate(values.date);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (new Date().getTimezoneOffset() !== -180) {
            setError('Different Timezone detected. Cannot handle input');
            setOpenError(true);
            return;
        }

        const priceAmountRegex = /^(\d+)$/;
        const noZeroRegex = /^(0*)$/;
        const alphaNumRegex = /^([A-Z]|[a-z]| |\/|\(|\)|-|\+|=|[0-9])*$/;
        const arr = Object.entries(state);

        if (arr.length < 4) {
            setError('All Inputs should be filled');
            setOpenError(true);
            return;
        }
        for (let i = 0; i < arr.length; i++) {
            if (arr[i][0] === "amount") {
                if (!priceAmountRegex.test(arr[i][1])) {
                    setError('Money to send cannot be negative or not a number');
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
            if (arr[i][0] === "to" || arr[i][0] === "from") {
                if (arr[i][1] === "To" || arr[i][1] === "From") {
                    setError('Sender & Reciever inputs should be filled');
                    setOpenError(true);
                    return;
                }
            }
            if (arr[i][0] === 'extra_data' && (!alphaNumRegex.test(arr[i][1]) || arr[i][1] === '')) {
                setError('Extra info should only be letters/numbers');
                setOpenError(true);
                return;
            }
        }
        let name = firebase.auth().currentUser.displayName;
        name = name.substring(0, name.lastIndexOf(" ")).toUpperCase();
        let values = {
            ...state,
            name: state.from,
            receiver: state.to,
            initiator: name
        }
        delete values.from;
        delete values.to;
        if (!values.flock) values.group = "0::0";
        delete values.flock;
        values.receiver = cleanSendReceive(values.receiver, name);
        values.name = cleanSendReceive(values.name, name);
        values.initiator = cleanSendReceive(values.initiator, name);
        let date = new Date(values.date);
        date.setHours(0,0,0,0);
        values.date = date;
        console.log(values);
        let proceed = parameterSendingChecks(values);
        if (proceed) {
            props.sendMoney(values);
            setOpenError(false);
            setOpen(true);
            setState({
                ...state,
                extra_data: ''
            });
        }
    };

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
        setOpenError(false);
    };

    const handleSelect = (e) => {
        e = typeof e === 'string' ? e.trim() : e;
        if (e === "Me" || e === "FromAnne") {
            setState({
                ...state,
                from: e
            });
        } else {
            if (!(e === "ToAnne" && state.from === "FromAnne")) {
                setState({
                    ...state,
                    to: e
                });
            }
        }
        if (e.target) {
            setState({
                ...state,
                [e.target.id]: e.target.value.trim()
            });
        }
    }

    const checkDate = (date) => {
        if (date.getTime() > new Date().getTime()) {
            setError('Invalid date');
            setOpenError(true);
            return false;
        } else {
            return true;
        }
    }

    const handleFlock = (e) => {
        if (extraData) {
          const object = extraData[0].groups;
          let g = Object.keys(object).find(key => object[key] === e);
          setState({
            ...state,
            group: g,
            flock: e
          });
        }
      }

    const handleDate = (date) => {
        setState({
            ...state,
            date: date
        });
    };

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
                    <h3 className="page-title">Input Money</h3>
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb">
                            <li className="breadcrumb-item"><a style={{textDecoration: 'none'}} href="!#" onClick={event => {
                                event.preventDefault();
                                setRedirect(true);
                            }}>Home</a></li>
                            <li className="breadcrumb-item active" aria-current="page">Input Money</li>
                        </ol>
                    </nav>
                </div>
                <div className="col-xl grid-margin stretch-card">
                    <div className="card">
                        <div className="card-body">
                            <h4 className="card-title">Input Money</h4>
                            <p className="card-description"> Enter money sent </p>
                            <form className="forms-sample">
                                <label htmlFor="date">Date</label>
                                <Form.Group>
                                    <DatePicker
                                        selected={state.date}
                                        onChange={handleDate}
                                        className="form-control text-white"
                                        id='date'
                                    />
                                </Form.Group>
                                <Form.Group>
                                    <label htmlFor='flock'>Flock</label>
                                    <DropdownButton
                                        alignRight
                                        title={state.flock || 'Choose Flock'}
                                        id='flock'
                                        onSelect={handleFlock}
                                    >
                                        {Array(...groups).sort().map(x => {
                                            return <Dropdown.Item eventKey={x}>{x}</Dropdown.Item>
                                        })}
                                    </DropdownButton>
                                </Form.Group>
                                <DropdownButton
                                    alignRight
                                    title={state.from}
                                    id="dropdown-menu-align-right1"
                                    onSelect={handleSelect}
                                >
                                    <Dropdown.Item eventKey="FromAnne">Anne</Dropdown.Item>
                                    <Dropdown.Divider />
                                    <Dropdown.Item eventKey="Me">Me</Dropdown.Item>
                                </DropdownButton>
                                <br />
                                <DropdownButton
                                    alignRight
                                    title={state.to}
                                    id="dropdown-menu-align-right2"
                                    onSelect={handleSelect}
                                >
                                    <Dropdown.Item eventKey="Victor">Victor</Dropdown.Item>
                                    <Dropdown.Item eventKey="ToAnne">Anne</Dropdown.Item>
                                    <Dropdown.Item eventKey="Jeff">Jeff</Dropdown.Item>
                                    <Dropdown.Item eventKey="Babra">Babra</Dropdown.Item>
                                    <Dropdown.Item eventKey="Purity">Purity</Dropdown.Item>
                                    <Dropdown.Divider />
                                    <Dropdown.Item eventKey="Bank">Bank</Dropdown.Item>
                                </DropdownButton>
                                <br />
                                <Form.Group>
                                    <label htmlFor="amount">Amount</label>
                                    <Form.Control type="text" onChange={handleSelect} className="form-control text-white" id="amount" placeholder="Enter Amount" />
                                </Form.Group>
                                <Form.Group>
                                    <label htmlFor="extra_data">Extra info</label>
                                    <Form.Control type="text" onChange={handleSelect} className="form-control text-white" id="extra_data" placeholder="Reason for the sending" />
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
                        <Alert onClose={handleClose} severity="warning">
                            Data will be submitted automatically when back online
                        </Alert>
                    </Snackbar>
                </Offline>
                <Snackbar open={openError} autoHideDuration={6000} onClose={handleClose}>
                    <Alert severity="error">{error}</Alert>
                </Snackbar>
            </div>
        )
}

const mapDispatchToProps = (dispatch) => {
    return {
        sendMoney: (money) => dispatch(sendMoney(money))
    }
}

const mapStateToProps = function(state) {
    return {
      extraData: state.firestore.ordered.extra_data
    }
}

export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    firestoreConnect([
      {collection: 'extra_data', doc: 'extra_data'}
    ])
)(InputMoney);
