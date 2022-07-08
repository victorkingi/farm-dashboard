import React, { useEffect, useState } from 'react';
import { Form } from 'react-bootstrap';
import DatePicker from "react-datepicker";
import bsCustomFileInput from 'bs-custom-file-input';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown'
import {Redirect} from "react-router-dom";
import Snackbar from "@material-ui/core/Snackbar";
import {Alert} from "./InputEggs";
import {Offline, Online} from "react-detect-offline";
import {connect} from "react-redux";
import {moneyBorrowed} from "../../services/actions/moneyAction";
import {firebase} from '../../services/api/fbConfig';

function InputBorrowed(props) {
    const [state, setState] = useState({
        date: new Date(),
        borrower: 'Who Gives Out',
        get_from: 'Receive From',
        category: 'borrow'
    });
    const [open, setOpen] = useState(false);
    const [openError, setOpenError] = useState(false);
    const [redirect, setRedirect] = useState(false);
    const [error, setError] = useState('');

    const checkDate = (date) => {
        if (date.getTime() > new Date().getTime()) {
            setError('Invalid date');
            setOpenError(true);
            return false;
        } else {
            return true;
        }
    }

    const parameterChecks = (values) => {
        if (values.borrower === values.get_from) {
            setError('Cannot borrow and get from yourself');
            setOpenError(true);
            return false;
        }
        if (values.purpose === "" || !values.purpose) {
            setError('Purpose cannot be empty');
            setOpenError(true);
            return false;
        }
        if (values.amount < 1) {
            setError('Invalid amount');
            setOpenError(true);
            return false;
        }
        if (!values.name) {
            setError('User undefined');
            setOpenError(true);
            return false;
        }
        return checkDate(values.date);
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        const amountRegex = /^([\d]+)$/;
        const noZeroRegex = /^(0*)$/;
        const arr = Object.entries(state);
        if (arr.length < 6) {
            setError('All Inputs should be filled');
            setOpenError(true);
            return;
        }
        for (let i = 0; i < arr.length; i++) {
            if (arr[i][0] === "amount") {
                if (!amountRegex.test(arr[i][1])) {
                    setError('Borrow amount cannot be negative or not a number');
                    setOpenError(true);
                    return;
                }
                if (noZeroRegex.test(arr[i][1])) {
                    setError('Borrow amount cannot be zero');
                    setOpenError(true);
                    return;
                }
                break;
            }
        }
        let name = firebase.auth().currentUser.displayName;
        name =  name.substring(0, name.lastIndexOf(" ")).toUpperCase();
        let values = {
            ...state,
            name
        }
        let date = new Date(values.date);
        date.setHours(0,0,0,0);
        values.date = date;
        let from;
        let to;
        if (values.borrower.startsWith("From")) from = values.borrower.substring(4).toUpperCase();
        if (values.get_from.startsWith("Get")) to = values.get_from.substring(3).toUpperCase();
        values.borrower = from;
        values.get_from = to;
        console.log(values);
        let proceed = parameterChecks(values);
        if (proceed) {
            props.moneyBorrowed(values);
            setOpenError(false);
            setOpen(true);
        }
    };

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
        setOpenError(false);
    };

    const handleDate = (date) => {
        setState({
            ...state,
            date: date
        });
    };

    const handleSelect = (e) => {
        if (typeof e === "string") {
            if (e.slice(0, 3) !== "Get") {
                setState({
                    ...state,
                    borrower: e
                });
            } else {
                setState({
                    ...state,
                    get_from: e
                });
            }
        }
        if (e.target) {
            if (e.target?.value === '0') {
                if (e.target.id === 'replaced') {
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
                    <h3 className="page-title">Input Borrowed</h3>
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb">
                            <li className="breadcrumb-item"><a style={{textDecoration: 'none'}} href="!#" onClick={event => {
                                event.preventDefault();
                                setRedirect(true);
                            }}>Home</a></li>
                            <li className="breadcrumb-item active" aria-current="page">Input Borrowed</li>
                        </ol>
                    </nav>
                </div>
                <div className="col-xl grid-margin stretch-card">
                    <div className="card">
                        <div className="card-body">
                            <h4 className="card-title">Input Borrowed</h4>
                            <p className="card-description"> Enter money borrowed </p>
                            <form className="forms-sample">
                                <label htmlFor="date">Date</label>
                                <Form.Group>
                                    <DatePicker
                                        selected={state.date}
                                        onChange={handleDate}
                                        className='form-control'
                                        id='date'
                                    />
                                </Form.Group>
                                <DropdownButton
                                    alignRight
                                    title={state.borrower}
                                    id="dropdown-menu-align-right1"
                                    onSelect={handleSelect}
                                >
                                    <Dropdown.Item eventKey="FromVictor">Victor</Dropdown.Item>
                                    <Dropdown.Item eventKey="FromAnne">Anne</Dropdown.Item>
                                    <Dropdown.Item eventKey="FromJeff">Jeff</Dropdown.Item>
                                    <Dropdown.Item eventKey="FromBabra">Babra</Dropdown.Item>
                                    <Dropdown.Item eventKey="FromPurity">Purity</Dropdown.Item>
                                </DropdownButton>
                                <br />
                                <DropdownButton
                                    alignRight
                                    title={state.get_from}
                                    id="dropdown-menu-align-right2"
                                    onSelect={handleSelect}
                                >
                                    <Dropdown.Item eventKey="GetVictor">Victor</Dropdown.Item>
                                    <Dropdown.Item eventKey="GetAnne">Anne</Dropdown.Item>
                                    <Dropdown.Item eventKey="GetJeff">Jeff</Dropdown.Item>
                                    <Dropdown.Item eventKey="GetBabra">Babra</Dropdown.Item>
                                    <Dropdown.Item eventKey="GetPurity">Purity</Dropdown.Item>
                                </DropdownButton>
                                <br />
                                <Form.Group>
                                    <label htmlFor="amount">Amount</label>
                                    <Form.Control type="text" onChange={handleSelect} className="form-control" id="amount" placeholder="Enter Amount" />
                                </Form.Group>
                                <Form.Group>
                                    <label htmlFor="purpose">Purpose</label>
                                    <Form.Control type="text" onChange={handleSelect} className="form-control" id="purpose" placeholder="Purpose" />
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
                    <Alert severity="error">{error}!</Alert>
                </Snackbar>
            </div>
        )
}

const mapDispatchToProps = (dispatch) => {
    return {
        moneyBorrowed: (borrow) => dispatch(moneyBorrowed(borrow))
    }
}

export default connect(null, mapDispatchToProps)(InputBorrowed);
