import React, { useEffect, useState } from 'react';
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

//df
function InputPurchase(props) {
    const [state, setState] = useState({
        date: new Date(),
        section: 'Choose Section',
        category: 'buys',
    });
    const [open, setOpen] = useState(false);
    const [openError, setOpenError] = useState(false);
    const [redirect, setRedirect] = useState(false);
    const [error, setError] = useState('');

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
                    setError('Object price and amount cannot be negative or zero');
                    setOpenError(true);
                    return;
                }
            }
            if (arr[i][1] === "" || !arr[i][1]) {
                setError('All Inputs should be filled');
                setOpenError(true);
                return;
            }
        }
        props.inputPurchase(state);
        setOpenError(false);
        setOpen(true);
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

    const componentDidMount = () => {
        bsCustomFileInput.init()
    }

    useEffect(() => {
        componentDidMount();
    }, []);

        if (redirect) {
            return (
                <Redirect to='/dashboard'/>
            )
        }
        return (
            <div>
                <div className="page-header">
                    <h3 className="page-title">Input Purchase</h3>
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb">
                            <li className="breadcrumb-item"><a href="!#" onClick={event => {
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
                                    <Dropdown.Item eventKey="Drug">Drug</Dropdown.Item>
                                    <Dropdown.Item eventKey="Other">Other</Dropdown.Item>
                                    <Dropdown.Divider />
                                    <Dropdown.Item eventKey="Purity">Purity</Dropdown.Item>
                                </DropdownButton>
                                <br />
                                <Form.Group>
                                    <label htmlFor="itemName">Item Name</label>
                                    <Form.Control type="text"
                                                  onChange={handleSelect}
                                                  className="form-control" id="itemName" placeholder="Name of Item" />
                                </Form.Group>
                                <Form.Group>
                                    <label htmlFor="objectNo">Number of Objects</label>
                                    <Form.Control type="number" onChange={handleSelect} className="form-control" id="objectNo" placeholder="Number of Objects" />
                                </Form.Group>
                                <Form.Group>
                                    <label htmlFor="objectPrice">Price per Object</label>
                                    <Form.Control type="number" onChange={handleSelect} className="form-control" id="objectPrice" placeholder="Price per Object" />
                                </Form.Group>
                                <div className="form-check">
                                    <label htmlFor="replaced" className="form-check-label text-muted">
                                        <input type="checkbox" onChange={handleSelect} className="form-check-input" id="replaced" name="replaced" defaultValue={0} />
                                        <i className="input-helper"></i>
                                        Replace wrong entry
                                    </label>
                                </div>
                                <button type="submit" className="btn btn-primary mr-2" onClick={handleSubmit}>Submit</button>
                            </form>
                        </div>
                    </div>
                </div>
                <Snackbar open={open} autoHideDuration={5000} onClose={handleClose}>
                    <Alert onClose={handleClose} severity="success">
                        Data Submitted
                    </Alert>
                </Snackbar>
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
