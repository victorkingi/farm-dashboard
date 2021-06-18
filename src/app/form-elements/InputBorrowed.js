import React, { useEffect, useState } from 'react';
import { Form } from 'react-bootstrap';
import DatePicker from "react-datepicker";
import bsCustomFileInput from 'bs-custom-file-input';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown'
import {Redirect} from "react-router-dom";
import Snackbar from "@material-ui/core/Snackbar";
import {Alert} from "./InputEggs";

//df
function InputBorrowed() {
    const [state, setState] = useState({
        selectedDate: new Date(),
        who: 'Who Borrowed',
        get_from: 'Receive From',
        category: 'borrow'
    });
    const [open, setOpen] = useState(false);
    const [openError, setOpenError] = useState(false);
    const [redirect, setRedirect] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const amountRegex = /^([\d]+)$/;
        const noZeroRegex = /^(0*)$/;
        const arr = Object.entries(state);
        console.log(arr.length)
        if (arr.length < 6) {
            setError('All Inputs should be filled');
            setOpenError(true);
            return;
        }
        for (let i = 0; i < arr.length; i++) {
            if (arr[i][0] === "amount") {
                if (!amountRegex.test(arr[i][1])) {
                    setError('Borrow amount cannot be negative');
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
            selectedDate: date
        });
    };

    const handleSelect = (e) => {
        console.log(e);
        if (typeof e === "string") {
            if (e.slice(0, 3) !== "Get") {
                setState({
                    ...state,
                    who: e
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

        console.log(state);
        if (redirect) {
            return (
                <Redirect to='/dashboard'/>
            )
        }
        return (
            <div>
                <div className="page-header">
                    <h3 className="page-title">Input Borrowed</h3>
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb">
                            <li className="breadcrumb-item"><a href="!#" onClick={event => {
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
                                        selected={state.selectedDate}
                                        onChange={handleDate}
                                        className='form-control'
                                        id='date'
                                    />
                                </Form.Group>
                                <DropdownButton
                                    alignRight
                                    title={state.who}
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
                                    <Form.Control type="number" onChange={handleSelect} className="form-control" id="amount" placeholder="Enter Amount" />
                                </Form.Group>
                                <Form.Group>
                                    <label htmlFor="purpose">Purpose</label>
                                    <Form.Control type="text" onChange={handleSelect} className="form-control" id="purpose" placeholder="Purpose" />
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
                <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
                    <Alert onClose={handleClose} severity="success">
                        Data Submitted
                    </Alert>
                </Snackbar>
                <Snackbar open={openError} autoHideDuration={6000} onClose={handleClose}>
                    <Alert severity="error">{error}!</Alert>
                </Snackbar>
            </div>
        )
}

export default InputBorrowed
