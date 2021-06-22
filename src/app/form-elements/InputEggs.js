import React, {useEffect, useState} from 'react';
import {Form} from 'react-bootstrap';
import {connect} from 'react-redux';
import {inputTray} from '../../services/actions/eggsAction';
import DatePicker from "react-datepicker";
import bsCustomFileInput from 'bs-custom-file-input';
import {Redirect} from "react-router-dom";
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
import "react-datepicker/dist/react-datepicker.css";

export function Alert(props) {
    return <MuiAlert elevation={6} variant="filled" {...props} />;
}

export function getLevelArray(obj) {
    return Object.entries(obj);
}

function getFinalLevelArray(state) {
    const arr = getLevelArray(state);
    let newArr = [];
    for (let i = 0; i < arr.length; i++) {
        if (!(arr[i][0] === "eggs" || arr[i][0] === "date"
            || arr[i][0] === "trays_store" || arr[i][0] === "category")) {
            newArr.push(arr[i][1]);
        }
    }
    return newArr;
}

//
function InputEggs(props) {
    const [state, setState] = useState({
        date: new Date(),
        category: 'eggs'
    });
    const [open, setOpen] = useState(false);
    const [openError, setOpenError] = useState(false);
    const [redirect, setRedirect] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const levelRegex = /^([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9]|6[0-9]|7[0-5])$/;
        const trayStoreRegex = /^([\d]+,(|[0-9]|1[0-9]|2[0-9]))$/;
        const arr = Object.entries(state);

        if (arr.length !== 11) {
            setError('All Inputs should be filled');
            setOpenError(true);
            return;
        }
        for (let i = 0; i < arr.length; i++) {
            if (arr[i][1] === "" || !arr[i][1]) {
                setError('All Inputs should be filled');
                setOpenError(true);
                return;
            }
            if (arr[i][0] === "trays_store") {
                if (!trayStoreRegex.test(arr[i][1])) {
                    setError('Trays in store should be of this format [Trays,eggs] & eggs are always less than 29');
                    setOpenError(true);
                    return;
                }
                break;
            }
        }



        const newArr = getFinalLevelArray(state);

        for (let i = 0; i < newArr.length; i++) {
            if (!levelRegex.test(newArr[i])) {
                setError('All level inputs should range from 0-75');
                setOpenError(true);
                return;
            }
        }
        props.inputTray(state);
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
            ...state,
            date: date
        });
    }

    const handleSelect = (e) => {
        e.preventDefault();
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
                <h3 className="page-title">Input Eggs Collected</h3>
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item"><a href="!#" onClick={event => {
                            event.preventDefault();
                            setRedirect(true);
                        }}>Home</a></li>
                        <li className="breadcrumb-item active" aria-current="page">Input Eggs</li>
                    </ol>
                </nav>
            </div>
            <div className="col-xl grid-margin stretch-card">
                <div className="card">
                    <div className="card-body">
                        <h4 className="card-title">Input Eggs</h4>
                        <p className="card-description"> Enter eggs collected </p>
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
                            <Form.Group>
                                <label htmlFor="a1">A1</label>
                                <Form.Control type="number" onChange={handleSelect} className="form-control" id="a1" placeholder="A1 Eggs" required />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="a2">A2</label>
                                <Form.Control type="number" onChange={handleSelect} className="form-control" id="a2" placeholder="A2 Eggs" />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="b1">B1</label>
                                <Form.Control type="number" onChange={handleSelect} className="form-control" id="b1" placeholder="B1 Eggs" />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="b2">B2</label>
                                <Form.Control type="number" onChange={handleSelect} className="form-control" id="b2" placeholder="B2 Eggs" />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="c1">C1</label>
                                <Form.Control type="number" onChange={handleSelect} className="form-control" id="c1" placeholder="C1 Eggs" />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="c2">C2</label>
                                <Form.Control type="number" onChange={handleSelect} className="form-control" id="c2" placeholder="C2 Eggs" />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="house">House</label>
                                <Form.Control type="number" onChange={handleSelect} className="form-control" id="house" placeholder="House Eggs" />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="broken">Broken</label>
                                <Form.Control type="number" onChange={handleSelect} className="form-control" id="broken" placeholder="Broken Eggs" />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="trays_store">Total Trays</label>
                                <Form.Control type="text" onChange={handleSelect} className="form-control" id="trays_store" placeholder="Total Trays And Extra Eggs Collected" />
                            </Form.Group>
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

const mapDispatchToProps = (dispatch) => {
    return {
        inputTray: (egg) => dispatch(inputTray(egg))
    }
}

export default connect(null, mapDispatchToProps)(InputEggs);
