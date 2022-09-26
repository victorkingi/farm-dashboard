import React, {useEffect, useMemo, useState} from 'react';
import { Form } from 'react-bootstrap';
import {connect} from 'react-redux';
import DatePicker from "react-datepicker";
import bsCustomFileInput from 'bs-custom-file-input';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown'
import {Redirect} from "react-router-dom";
import "react-datepicker/dist/react-datepicker.css";
import Snackbar from "@material-ui/core/Snackbar";
import {Alert} from "./InputEggs";
import {inputPurchase} from "../../services/actions/buyAction";
import {Offline, Online} from "react-detect-offline";
import {getSectionAddr} from "../../services/actions/salesAction";
import {firebase} from '../../services/api/fbConfig';

function InputPurchase(props) {
    const [state, setState] = useState({
        date: new Date(),
        section: 'Choose Section',
        objectNo: '',
        itemName: '',
        vendorName: '',
        category: 'buys'
    });
    const [open, setOpen] = useState(false);
    const [openError, setOpenError] = useState(false);
    const [redirect, setRedirect] = useState(false);
    const [error, setError] = useState('');
    const [isFeeds, setIsFeeds] = useState(false);

    let name = firebase.auth().currentUser?.displayName || '';
    name = name.substring(0, name.lastIndexOf(" ")).toUpperCase();

    useEffect(() => {
        if (state.section === "Feeds") setIsFeeds(true);
        else setIsFeeds(false);
    }, [state.section]);

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
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        if (values.itemName) {
            values.itemName = values.itemName.charAt(0).toUpperCase().concat(values
                .itemName.substring(1).toLowerCase());
        }
        if (values.section === 'FEEDS') {
            const validVendors = ["KINYANJUI", "THIKA FARMERS"];
            const validFeeds = ["LAYERS", "CHICK", "GROWERS", "STARTER"];
            values.vendorName = values.vendorName.toUpperCase();
            if (!validVendors.includes(values.vendorName)) {
                console.log("invalid vendor name");
                return false;
            }
            if (!validFeeds.includes(values.itemName.toUpperCase())) {
                console.log("invalid feeds name");
                return false;
            }
        }
        if (values.itemName && values.section === "PPURITY") {
            const regex = /^([A-Z][a-z]{2},)+$/;
            if (!regex.test(values.itemName)) {
                setError("Item name should be of this format [Month,Month] i.e. Jan,Feb");
                setOpenError(true);
                return false;
            } else {
                const enteredMonths = values.itemName.split(',');
                const found = [];
                for (let i = 0; i < enteredMonths.length; i++) {
                    for (let p = 0; p < months.length; p++) {
                        if (enteredMonths[i] === months[p]) {
                            if (found.includes(months[p])) {
                                setError("Duplicate months entered");
                                setOpenError(true);
                                return false;
                            }
                            if (found.length !== 0) {
                                const lastEntered = found[found.length-1];
                                const index = months.indexOf(lastEntered);
                                if (months[(index+1)%12] !== enteredMonths[i]) {
                                    setError("Inconsistent months, next should be "+months[(index+1)%12]);
                                    setOpenError(true);
                                    return false;
                                }
                            }
                            found.push(enteredMonths[i]);
                        }
                    }
                }
                if (found.length+1 !== enteredMonths.length) {
                    setError("Item name should be of this format [Month,Month] i.e. Jan,Feb");
                    setOpenError(true);
                    return false;
                }
                if (found.length !== parseInt(values.objectNo) || parseInt(values.objectNo) > 12) {
                    setError("Item name should be of this format [Month,Month] i.e. Jan,Feb and object number should be equal to number of months");
                    setOpenError(true);
                    return false;
                }
            }
        } else if (!values.section || values.section === "CHOOSE_SECTION") {
            setError('Section cannot be empty');
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
        const priceAmountRegex = /^([\d]+)$/;
        const arr = Object.entries(state);

        if (arr.length < 6) {
            setError('All Inputs should be filled');
            setOpenError(true);
            return;
        }
        for (let i = 0; i < arr.length; i++) {
            if (arr[i][0] === "objectNo" || arr[i][0] === "objectPrice") {
                if (!priceAmountRegex.test(arr[i][1])) {
                    setError('Object price and amount cannot be negative, zero or not a number');
                    setOpenError(true);
                    return;
                }
            }
            if (arr[i][1] === "") {
                setError('All Inputs should be filled');
                setOpenError(true);
                return;
            }
        }
        let values = {
            ...state,
            name
        };
        if (values.section !== "Feeds") delete values.vendorName;

        values.section = getSectionAddr(values.section);
        let date = new Date(values.date);
        date.setHours(0,0,0,0);
        values.date = date;
        let proceed = parameterChecks(values);
        if (proceed) {
            values.itemName = values.itemName.toUpperCase();
            props.inputPurchase(values);
            setOpenError(false);
            setOpen(true);
        } else {
            setOpenError(true);
            setOpen(false);
            setError("Some values might be wrong");
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
        if (e.target) {
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
        } else {
            setState({
                ...state,
                section: e
            });
        }
    }

    useMemo(() => {
        if (/^([A-Z][a-z]{2},)+$/.test(state.itemName) && state.section === 'Pay Purity') {
            setState({
                ...state,
                objectNo: (state.itemName.split(',').length - 1).toString()
            });
        } else if (state.section === 'Pay Purity') {
            setState({
                ...state,
                objectNo: '0'
            });
        }
        // eslint-disable-next-line
    }, [state.itemName]);

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
                <h3 className="page-title">Input Purchase</h3>
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item"><a style={{textDecoration: 'none'}} href="!#" onClick={event => {
                            event.preventDefault();
                            setRedirect(true);
                        }}>Home</a></li>
                        <li className="breadcrumb-item active" aria-current="page">Input Purchase</li>
                    </ol>
                </nav>
            </div>
            <div className="col-xl grid-margin stretch-card">
                <div className="card">
                    <div className="card-body">
                        <h4 className="card-title">Input Purchase</h4>
                        <p className="card-description"> Enter purchase made </p>
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
                                title={state.section}
                                id="dropdown-menu-align-right"
                                onSelect={handleSelect}
                            >
                                <Dropdown.Item eventKey="Feeds">Feeds</Dropdown.Item>
                                <Dropdown.Item eventKey="Drugs">Drugs</Dropdown.Item>
                                <Dropdown.Item eventKey="Other Purchase">Other Purchase</Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item eventKey="Pay Purity">Pay Purity</Dropdown.Item>
                            </DropdownButton>
                            <br />
                            {isFeeds &&
                                <Form.Group>
                                <label htmlFor="itemName">Vendor Name</label>
                                <Form.Control type="text"
                                              onChange={handleSelect}
                                              className="form-control" id="vendorName" placeholder="Feeds bought from" />
                                </Form.Group>
                            }
                            <Form.Group>
                                <label htmlFor="itemName">Item Name</label>
                                <Form.Control type="text"
                                              onChange={handleSelect}
                                              className="form-control" id="itemName" placeholder="Name of Item" />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="objectNo">Number of Objects</label>
                                <Form.Control value={state.objectNo} type="text" onChange={handleSelect} className="form-control" id="objectNo" placeholder="Number of Objects" />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="objectPrice">Price per Object</label>
                                <Form.Control type="text" onChange={handleSelect} className="form-control" id="objectPrice" placeholder="Price per Object" />
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
            <Snackbar open={openError} autoHideDuration={3000} onClose={handleClose}>
                <Alert severity="error">{error}!</Alert>
            </Snackbar>
        </div>
    )
}

const mapDispatchToProps = (dispatch) => {
    return {
        inputPurchase: (buy) => dispatch(inputPurchase(buy))
    }
}

export default connect(null, mapDispatchToProps)(InputPurchase);
