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
import {Offline, Online} from "react-detect-offline";

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
        if (!(arr[i][0] === "eggs" || arr[i][0] === "date_"
            || arr[i][0] === "trays_store" || arr[i][0] === "category")) {
            newArr.push(arr[i][1]);
        }
    }
    return newArr;
}

//
function InputEggs(props) {
    const [state, setState] = useState({
        date_: new Date(),
        category: 'eggs'
    });
    const [open, setOpen] = useState(false);
    const [openError, setOpenError] = useState(false);
    const [redirect, setRedirect] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const levelRegex = /^([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9]|6[0-9]|7[0-5])$/;
        const trayStoreRegex = /^[0-9]+,([0-9]|1[0-9]|2[0-9])$/;
        const eggsRegex = /^([0-9]+,){12}$/;
        const bagsRegex = /^[0-9]+$/.test(state.bags_store);
        const arr = Object.entries(state);

        for (let i = 0; i < arr.length; i++) {
            if (arr[i][1] === "" || !arr[i][1]) {
                setError('All Inputs should be filled');
                setOpenError(true);
                return;
            }
            if (arr[i][0] === "eggs") {
                if (!eggsRegex.test(arr[i][1])) {
                    setError('eggs collected should be in this format [eggs,eggs,]');
                    setOpenError(true);
                    return;
                }
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
        if (!bagsRegex) {
            setError('Bags entered should only be a number');
            setOpenError(true);
            return;
        }
        if (new Date().getTimezoneOffset() !== -180) {
            setError('Different Timezone detected. Cannot handle input');
            setOpenError(true);
            return;
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
            date_: date
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
                        <li className="breadcrumb-item"><a style={{textDecoration: 'none'}} href="!#" onClick={event => {
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
                            <label htmlFor="date_">Date</label>
                            <Form.Group>
                                <DatePicker
                                    selected={state.date_}
                                    onChange={handleDate}
                                    className='form-control'
                                    id='date_'
                                />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="level">Level ordering</label>
                                <Form.Control disabled type="text" className="form-control" id="level" placeholder="A1,B1,C1,A2,B2,C2,A3,B3,C3,A4,B4,C4" />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="eggs">Eggs</label>
                                <Form.Control type="text" onChange={handleSelect} className="form-control" id="eggs" placeholder="Number of eggs (comma separated)" />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="broken">Broken</label>
                                <Form.Control type="text" onChange={handleSelect} className="form-control" id="broken" placeholder="Broken Eggs" />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="trays_store">Total Trays</label>
                                <Form.Control type="text" onChange={handleSelect} className="form-control" id="trays_store" placeholder="Total Trays And Extra Eggs Collected" />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="bags_store">Bags in Store</label>
                                <Form.Control type="text" onChange={handleSelect} className="form-control" id="bags_store" placeholder="Current bags of feeds in store" />
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
        inputTray: (egg) => dispatch(inputTray(egg))
    }
}

export default connect(null, mapDispatchToProps)(InputEggs);
